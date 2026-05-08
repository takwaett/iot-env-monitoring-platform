from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.sensor.models.sensor_model import SensorModel 
from src.modules.threshold.models.threshold_model import ThresholdModel
from src.modules.alert.models.alert_model import AlertModel 
from src.modules.measurement.dtos.measurement_dto import MeasurementImportDTO

class MeasurementService:  
    async def process_simulation_data(self, db: AsyncSession, dto: MeasurementImportDTO):
        sensor_query = select(SensorModel).where(
            SensorModel.node_id == dto.node_id,
            SensorModel.name == dto.sensor_name,
            SensorModel.type == dto.type
        )
        sensor_result = await db.execute(sensor_query)
        sensor = sensor_result.scalars().first()
        
        if not sensor:
            return None

        t_query = select(ThresholdModel).where(
            ThresholdModel.node_id == dto.node_id,
            ThresholdModel.sensor_id == sensor.id,
            ThresholdModel.type == dto.type
        )
        t_res = await db.execute(t_query)
        threshold = t_res.scalars().first()

        alert_msg_final = None
        if threshold:
            alert_type = None
            msg = ""

            if dto.value > threshold.maxval: 
                alert_type = "danger"
                msg = f"le capteur {dto.sensor_name} du noeud {dto.node_id} a détecté une valeure maximale qui entraine un danger"
            
            elif dto.value < threshold.minval: 
                alert_type = "inactivity"
                msg = f"le capteur {dto.sensor_name} du noeud {dto.node_id} a détecté une valeure minimale qui entraine l'inactivity"

            if alert_type:
                alert_msg_final = msg
                new_alert = AlertModel(
                    message=msg,
                    alert=alert_type,
                    node_id=dto.node_id,
                    sensor_id=sensor.id
                )
                db.add(new_alert)

        try:
            new_measurement = MeasurementModel(
                sensor_id=sensor.id,
                value=dto.value
            )
            db.add(new_measurement)
            
            await db.commit()
            await db.refresh(new_measurement) 
            
       
            return {"measurement": new_measurement, "alert_msg": alert_msg_final}
            
        except Exception as e:
            await db.rollback()
            return None
