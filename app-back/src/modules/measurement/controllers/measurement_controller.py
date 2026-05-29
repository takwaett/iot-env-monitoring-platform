from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from src.modules.measurement.dtos.measurement_dto import MeasurementResponse, MeasurementImportDTO
from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.sensor.models.sensor_model import SensorModel
from src.modules.node.models.node_model import NodeModel
from src.modules.measurement.services.measurement_service import MeasurementService 

from src.utils.database import get_db
from src.utils.dependencies import get_current_user
from src.modules.auth.models.user_model import UserModel

router = APIRouter(prefix="/measurements", tags=["Measurements"])
measurement_service = MeasurementService()

# 1. ENREGISTRER UNE MESURE SIMULÉE (POST) - ACCÈS PUBLIC SANS TOKEN POUR DATA_SENDER
@router.post("/data/insert", status_code=status.HTTP_201_CREATED)
async def insert_measurements(
    dto: MeasurementImportDTO, 
    db: AsyncSession = Depends(get_db)
):
    result = await measurement_service.process_simulation_data(db, dto)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Nœud ou capteur '{dto.sensor_name}' introuvable pour le nœud {dto.node_id}"
        )
    
    response_msg = result["alert_msg"] if result["alert_msg"] else "Donnée enregistrée avec succès."
        
    return {
        "status": "success", 
        "message": response_msg, 
        "data": result["measurement"]
    }

# 2. RÉCUPÉRER TOUTES LES MESURES DE L'UTILISATEUR CONNECTÉ (GET) - STRICTEMENT CLOISONNÉ VIA TOKEN
@router.get("/", response_model=List[MeasurementResponse])
async def get_all_measurements(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    try:
        query = (
            select(MeasurementModel)
            .join(SensorModel, MeasurementModel.sensor_id == SensorModel.id)
            .join(NodeModel, SensorModel.node_id == NodeModel.id)
            .where(NodeModel.user_id == current_user.id)
            .order_by(desc(MeasurementModel.created_at))
        )
        result = await db.execute(query)
        return result.scalars().all()
    except Exception as e:
        print(f"❌ ERREUR RECOVERY MESURES : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Erreur lors de la récupération de vos mesures"
        )

# 3. RÉCUPÉRER LES SÉRIES TEMPORELLES DEPUIS INFLUXDB V3 (GET) - AVEC TOKEN
@router.get("/series")
async def get_influx_time_series(
    field_name: str = Query(..., description="temperature, humidity, pressure, air_quality"),
    period: str = Query("30m", description="Options: 30m, 1h, 24h, 7d"),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Endpoint ultra-rapide appelé par Graphes.js pour récupérer l'historique lissé.
    Sécurisé par token (l'utilisateur doit posséder un compte valide pour visualiser).
    """
    if field_name not in ["temperature", "humidity", "pressure", "air_quality"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Métrique inconnue. Valeurs acceptées: temperature, humidity, pressure, air_quality"
        )
        
    if period not in ["30m", "1h", "24h", "7d"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Période invalide. Valeurs acceptées: 30m, 1h, 24h, 7d"
        )
    
    try:
        points = await measurement_service.get_influx_series_data(field_name, period)
        return {
            "status": "success",
            "field_name": field_name,
            "period": period,
            "points": points
        }
    except Exception as e:
        print(f"❌ ERREUR CONTRÔLEUR SÉRIES INFLUXDB : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible d'extraire la série temporelle demandée"
        )

# 4. NOUVEAU : RÉCUPÉRER LES SUBSTANCES DU MQ135 POUR LA PAGE /GAZ (GET) - AVEC TOKEN
@router.get("/gas-dashboard")
async def get_multi_gas_dashboard(
    period: str = Query("24h", description="Options: 30m, 1h, 24h, 7d"),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Endpoint sécurisé retournant l'état actuel et l'historique lissé de chaque gaz.
    Consommé directement par votre page frontend gaz.js.
    """
    if period not in ["30m", "1h", "24h", "7d"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Période invalide. Valeurs acceptées: 30m, 1h, 24h, 7d"
        )
    try:
        data = await measurement_service.get_gas_dashboard_data(period=period)
        return {
            "status": "success",
            "period": period,
            "data": data
        }
    except Exception as e:
        print(f"❌ ERREUR CONTRÔLEUR GAZ MULTI-SUBSTANCES : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de générer les données multi-substances du capteur"
        )
