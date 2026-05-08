from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from src.modules.measurement.dtos.measurement_dto import MeasurementResponse, MeasurementImportDTO
from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.measurement.services.measurement_service import MeasurementService 

from src.utils.database import get_db
from src.utils.dependencies import get_current_user

router = APIRouter(prefix="/measurements", tags=["Measurements"])
measurement_service = MeasurementService()

@router.post("/data/insert", status_code=status.HTTP_201_CREATED)
async def insert_measurements(
    dto: MeasurementImportDTO, 
    db: AsyncSession = Depends(get_db)
):
    # Appel du service qui contient maintenant la logique d'alerte
    result = await measurement_service.process_simulation_data(db, dto)
    
    if not result:
        raise HTTPException(
            status_code=404, 
            detail=f"Capteur '{dto.sensor_name}' non trouvé pour le nœud {dto.node_id}"
        )
    
    # On renvoie le message d'alerte personnalisé s'il existe
    # Sinon on met un message par défaut
    response_msg = result["alert_msg"] if result["alert_msg"] else "Donnée enregistrée"
        
    return {
        "status": "success", 
        "message": response_msg, 
        "data": result["measurement"]
    }


@router.get("/", response_model=List[MeasurementResponse])
async def get_all_measurements(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Correction : tri par created_at (selon ton DTO)
        query = select(MeasurementModel).order_by(desc(MeasurementModel.created_at))
        result = await db.execute(query)
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération")
