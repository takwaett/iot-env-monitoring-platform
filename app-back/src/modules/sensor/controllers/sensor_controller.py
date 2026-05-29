from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession 
from src.modules.sensor.services import sensor_service
from src.modules.sensor.dtos.sensor_dto import SensorCreate, SensorUpdate, SensorResponse
from src.utils.database import get_db
from src.utils.dependencies import get_current_user
from src.modules.auth.models.user_model import UserModel
from typing import List

router = APIRouter(prefix="/sensors", tags=["Sensors"])

# 1. RÉCUPÉRER LES CAPTEURS DE L'UTILISATEUR CONNECTÉ (GET)
@router.get("/", response_model=List[SensorResponse])
async def get_sensors(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Récupère uniquement la liste des capteurs associés aux nœuds de l'utilisateur."""
    return await sensor_service.get_sensors(db, user_id=current_user.id)

# 2. CRÉER UN CAPTEUR POUR UN NŒUD DE L'UTILISATEUR (POST)
@router.post("/", response_model=SensorResponse, status_code=status.HTTP_201_CREATED)
async def add_sensor( 
    sensor: SensorCreate, 
    db: AsyncSession = Depends(get_db),  
    current_user: UserModel = Depends(get_current_user)
):
    """Crée un capteur après vérification que le nœud parent appartient à l'utilisateur."""
    return await sensor_service.create_sensor(db, sensor, user_id=current_user.id)

# 3. MODIFIER UN CAPTEUR DE L'UTILISATEUR (PUT)
@router.put("/{sensor_id}", response_model=SensorResponse)
async def update_sensor(
    sensor_id: int,
    sensor: SensorUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Modifie un capteur existant si l'utilisateur possède le nœud parent."""
    db_sensor = await sensor_service.update_sensor(db, sensor_id, sensor, user_id=current_user.id)
    if not db_sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Capteur introuvable ou accès non autorisé."
        )
    return db_sensor

# 4. SUPPRIMER UN CAPTEUR DE L'UTILISATEUR (DELETE)
@router.delete("/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sensor(
    sensor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Supprime un capteur existant si l'utilisateur possède le nœud parent."""
    try:
        success = await sensor_service.delete_sensor(db, sensor_id, user_id=current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Capteur introuvable ou accès non autorisé."
            )
        return None
    except Exception as e:
        if "foreign key constraint" in str(e).lower() or "not-null" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Impossible de supprimer : des mesures sont liées à ce capteur."
            )
        raise e
