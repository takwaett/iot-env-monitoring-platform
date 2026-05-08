from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from src.modules.threshold.models.threshold_model import ThresholdModel
from src.modules.alert.models.alert_model import AlertModel

from src.modules.threshold.dtos.threshold_dto import ThresholdCreate 

async def create_threshold(db: AsyncSession, threshold_data: ThresholdCreate):
    db_threshold = ThresholdModel(**threshold_data.model_dump())
    db.add(db_threshold)
    await db.commit()
    await db.refresh(db_threshold)
    return db_threshold

def check_threshold_exceeded(value: float, threshold: ThresholdModel):
    if value > threshold.maxval:
        return "danger"
    if value < threshold.minval:
        return "Value very low"
    return None

# --- 3. RECHERCHE DE CONFIGURATION ---
async def get_threshold_config(db: AsyncSession, node_id: int, sensor_id: int, measure_type: str):
    query = select(ThresholdModel).where(
        ThresholdModel.node_id == node_id,
        ThresholdModel.sensor_id == sensor_id,
        ThresholdModel.type == measure_type
    )
    result = await db.execute(query)
    return result.scalars().first()

# --- 4. LOGIQUE D'ALERTE ---
async def process_measurement_alert(db: AsyncSession, node_id: int, sensor_id: int, value: float, measure_type: str):
    threshold = await get_threshold_config(db, node_id, sensor_id, measure_type)
    if not threshold:
        return None
    

    alert_type = None
    message_content = ""

    if value > threshold.maxval:
        alert_type = "danger"
        message_content = f"le capteur {sensor_id} du noeud {node_id} a détecté une valeur maximale qui entraine un danger"
    elif value < threshold.minval:
        alert_type = "inactivity"
        message_content = f"le capteur {sensor_id} du noeud {node_id} a détecté une valeur minimale qui entraine l'inactivity"

   
    if alert_type:
        new_alert = AlertModel(
            message=message_content, 
            alert=alert_type, 
            node_id=node_id, 
        )
        
        db.add(new_alert)
        print(f"\033[{'91m' if alert_type == 'danger' else '93m'}{message_content} | Alert: {alert_type}\033[0m")


        return message_content
        
    return None

