from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy.future import select
from src.modules.sensor.models.sensor_model import SensorModel
from src.modules.sensor.dtos.sensor_dto import SensorCreate

# Récupérer tous les capteurs
async def get_sensors(db: AsyncSession):
    result = await db.execute(select(SensorModel))
    return result.scalars().all()

# Créer un nouveau capteur
async def create_sensor(db: AsyncSession, sensors_data: SensorCreate):
    db_sensor = SensorModel(**sensors_data.model_dump())
    db.add(db_sensor)
    await db.commit() 
    await db.refresh(db_sensor)
    return db_sensor

# put:mise à jour
async def update_sensor(db: AsyncSession, sensor_id: int, sensor_data: SensorCreate):
    result = await db.execute(select(SensorModel).filter(SensorModel.id == sensor_id))
    db_sensor = result.scalar_one_or_none()
    
    if db_sensor:
        for key, value in sensor_data.model_dump().items():
            setattr(db_sensor, key, value)
        await db.commit()
        await db.refresh(db_sensor)
        return db_sensor
    return None

async def delete_sensor(db: AsyncSession, sensor_id: int):
    result = await db.execute(select(SensorModel).filter(SensorModel.id == sensor_id))
    db_sensor = result.scalar_one_or_none()
    
    if db_sensor:
        await db.delete(db_sensor)
        await db.commit()
        return {"message": "Capteur supprimé avec succès"}
    return {"error": "Capteur non trouvé"}
