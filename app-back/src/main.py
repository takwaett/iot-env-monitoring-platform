import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv 
from fastapi import FastAPI, Depends # Ajout de Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func 
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv()

from src.utils.database import Base, engine, AsyncSessionLocal, get_db 
from src.utils.dependencies import get_current_user 

from src.modules.threshold.models.threshold_model import ThresholdModel
from src.modules.node.models.node_model import NodeModel
from src.modules.sensor.models.sensor_model import SensorModel
from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.alert.models.alert_model import AlertModel
from src.modules.auth.models.user_model import UserModel

from src.modules.threshold.controllers.threshold_controller import router as threshold_router
from src.modules.sensor.controllers.sensor_controller import router as sensor_router
from src.modules.node.controllers.node_controller import router as node_router
from src.modules.measurement.controllers.measurement_controller import router as measurement_router
from src.modules.alert.controllers.alert_controller import router as alert_router
from src.modules.auth.controllers.auth_controller import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Initialisation du Backend et vérification de la base de données...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"❌ Erreur de connexion DB au démarrage : {e}")
    yield 
    print("🛑 Arrêt du serveur...")
    await engine.dispose()

app = FastAPI(title="IoT Backend Project", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router) 
app.include_router(sensor_router)
app.include_router(node_router)
app.include_router(measurement_router)
app.include_router(alert_router)
app.include_router(threshold_router)

@app.get("/dashboard/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    try:
        res_total = await db.execute(select(func.count(NodeModel.id)))
        total_nodes = res_total.scalar()

        res_active = await db.execute(
            select(func.count(NodeModel.id)).where(NodeModel.statut == "Online")
        )
        active_nodes = res_active.scalar()

        res_sensors = await db.execute(select(func.count(SensorModel.id)))
        total_sensors = res_sensors.scalar()

        res_danger = await db.execute(
            select(func.count(AlertModel.id)).where(AlertModel.alert == "danger")
        )
        danger_alerts = res_danger.scalar()

        return {
            "total_noeuds": total_nodes or 0,
            "actifs": active_nodes or 0,
            "capteurs": total_sensors or 0,
            "alertes_danger": danger_alerts or 0
        }
    except Exception as e:
        print(f"❌ ERREUR SQL DÉTAILLÉE : {e}")
        return {
            "total_noeuds": 0, "actifs": 0, "capteurs": 0, "alertes_danger": 0,
            "error_msg": str(e)
        }



@app.get("/")
async def root():
    return {"status": "online", "message": "Backend is running"}
