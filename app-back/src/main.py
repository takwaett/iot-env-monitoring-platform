# main.py
import os
import asyncio
import csv
import io
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv()

# =========================
# DATABASE
# =========================
from src.utils.database import Base, engine, get_db

# =========================
# AUTH DEPENDENCY
# =========================
from src.utils.dependencies import get_current_user

# =========================
# MODELS
# =========================
from src.modules.threshold.models.threshold_model import ThresholdModel
from src.modules.node.models.node_model import NodeModel
from src.modules.sensor.models.sensor_model import SensorModel
from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.alert.models.alert_model import AlertModel
from src.modules.auth.models.user_model import UserModel
from src.modules.Report.models.Report_model import ReportConfigModel, ReportHistoryModel

# =========================
# ROUTERS
# =========================
from src.modules.threshold.controllers.threshold_controller import router as threshold_router
from src.modules.sensor.controllers.sensor_controller import router as sensor_router
from src.modules.node.controllers.node_controller import router as node_router
from src.modules.measurement.controllers.measurement_controller import router as measurement_router
from src.modules.alert.controllers.alert_controller import router as alert_router
from src.modules.Report.controllers.Report_controller import router as report_router
from src.modules.auth.controllers.auth_controller import router as auth_router

# =========================
# SCHEDULER (PLANIFICATEUR)
# =========================
from src.utils.scheduler import start_scheduler, stop_scheduler



# =========================
# LIFESPAN (Gestion du démarrage et de l'arrêt)
# =========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Démarrage du backend IoT EnviroSense...")
    try:
        async with engine.begin() as conn:
            # Génère automatiquement les tables en BDD
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Base de données et tables synchronisées avec succès.")
    except Exception as e:
        print(f"❌ DB ERROR: {e}")

    # ========================
    # DÉMARRAGE DU PLANIFICATEUR
    # ========================
    try:
        start_scheduler()
        print("✅ Planificateur de rapports démarré avec succès")
    except Exception as e:
        print(f"⚠️ Erreur démarrage planificateur: {e}")

    yield

    # ========================
    # ARRÊT DU PLANIFICATEUR
    # ========================
    try:
        stop_scheduler()
        print("🛑 Planificateur de rapports arrêté")
    except Exception as e:
        print(f"⚠️ Erreur arrêt planificateur: {e}")

    print("🛑 Arrêt du backend IoT...")
    await engine.dispose()


# =========================
# APPLICATION INIT
# =========================
app = FastAPI(
    title="EnviroSense IoT Backend API",
    version="1.0.0",
    lifespan=lifespan
)


# =========================
# CORS MIDDLEWARE
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# REGISTRATION DES ROUTERS
# =========================
app.include_router(auth_router)
app.include_router(sensor_router)
app.include_router(node_router)
app.include_router(measurement_router)
app.include_router(alert_router)
app.include_router(threshold_router)
app.include_router(report_router)


# =========================
# DASHBOARD STATS
# =========================
@app.get("/dashboard/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    try:
        # Filtrage par user_id sur le noeud
        total_nodes = (await db.execute(
            select(func.count(NodeModel.id)).where(NodeModel.user_id == current_user.id)
        )).scalar() or 0
        
        active_nodes = (await db.execute(
            select(func.count(NodeModel.id)).where(NodeModel.user_id == current_user.id, NodeModel.statut == "Online")
        )).scalar() or 0
        
        # Jointure obligatoire pour compter uniquement les capteurs de cet utilisateur
        total_sensors = (await db.execute(
            select(func.count(SensorModel.id))
            .join(NodeModel, SensorModel.node_id == NodeModel.id)
            .where(NodeModel.user_id == current_user.id)
        )).scalar() or 0
        
        # Jointure obligatoire pour compter uniquement les alertes danger de cet utilisateur
        danger_alerts = (await db.execute(
            select(func.count(AlertModel.id))
            .join(NodeModel, AlertModel.node_id == NodeModel.id)
            .where(AlertModel.alert == "danger", NodeModel.user_id == current_user.id)
        )).scalar() or 0

        return {
            "total_noeuds": total_nodes,
            "actifs": active_nodes,
            "capteurs": total_sensors,
            "alertes_danger": danger_alerts
        }
    except Exception as e:
        print("❌ DASHBOARD ERROR:", e)
        return {"total_noeuds": 0, "actifs": 0, "capteurs": 0, "alertes_danger": 0}


# =========================
# ALERTES DANGER
# =========================
@app.get("/dashboard/alerts/danger")
async def get_dashboard_danger_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    try:
        # Jointure ajoutée pour limiter l'exposition aux alertes de l'utilisateur connecté
        result = await db.execute(
            select(AlertModel)
            .join(NodeModel, AlertModel.node_id == NodeModel.id)
            .where(AlertModel.alert == "danger", NodeModel.user_id == current_user.id)
            .order_by(AlertModel.created_at.desc())
            .limit(10)
        )
        return result.scalars().all()
    except Exception as e:
        print("❌ ALERT ERROR:", e)
        return []


# =========================
# EXPORT CSV GLOBAL
# =========================
@app.get("/dashboard/export-my-data")
async def export_user_data(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    try:
        # Jointure ajoutée pour n'exporter que les alertes de l'utilisateur connecté
        result = await db.execute(
            select(AlertModel)
            .join(NodeModel, AlertModel.node_id == NodeModel.id)
            .where(NodeModel.user_id == current_user.id)
            .order_by(AlertModel.created_at.desc())
        )
        alerts = result.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Message", "Date", "Statut"])

        for alert in alerts:
            date_str = alert.created_at.strftime("%Y-%m-%d %H:%M:%S") if alert.created_at else "N/A"
            writer.writerow([alert.message, date_str, alert.alert])

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8-sig")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=export_user_{current_user.id}_data.csv"}
        )
    except Exception as e:
        print("❌ EXPORT ERROR:", e)
        return {"error": "Erreur exportation"}


# =========================
# HEALTH CHECK (Optionnel)
# =========================
@app.get("/health")
async def health_check():
    """Endpoint de vérification de l'état du serveur"""
    return {
        "status": "healthy",
        "scheduler": "running"  # Vous pouvez améliorer pour vérifier réellement
    }


# =========================
# ROOT API ENDPOINT
# =========================
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Backend IoT EnviroSense running smoothly 🚀",
        "version": "1.0.0",
        "features": {
            "reports": "daily and weekly automatic PDF reports",
            "scheduler": "APScheduler enabled",
            "email": "SMTP configured"
        }
    }