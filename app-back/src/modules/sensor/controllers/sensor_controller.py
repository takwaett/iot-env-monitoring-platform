from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession 
from src.modules.sensor.services import sensor_service
from src.modules.sensor.dtos.sensor_dto import SensorCreate, SensorResponse
from src.utils.database import get_db
from src.utils.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/sensors", tags=["Sensors"])

# 1. RÉCUPÉRER (GET) - CORRIGÉ
@router.get("/", response_model=List[SensorResponse])
async def get_sensors(
    db: AsyncSession = Depends(get_db)
    
):
    return await sensor_service.get_sensors(db)

# 2. CRÉER (POST)
@router.post("/", response_model=SensorResponse, status_code=status.HTTP_201_CREATED)
async def add_sensor( 
    sensor: SensorCreate, 
    db: AsyncSession = Depends(get_db),  
    current_user: str = Depends(get_current_user)
):
    return await sensor_service.create_sensor(db, sensor)

# 3. MODIFIER (PUT)
@router.put("/{sensor_id}", response_model=SensorResponse)
async def update_sensor(
    sensor_id: int,
    sensor: SensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_sensor = await sensor_service.update_sensor(db, sensor_id, sensor)
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Capteur introuvable")
    return db_sensor

# 4. SUPPRIMER (DELETE)
@router.delete("/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sensor(
    sensor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    success = await sensor_service.delete_sensor(db, sensor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Capteur introuvable")
    return None
