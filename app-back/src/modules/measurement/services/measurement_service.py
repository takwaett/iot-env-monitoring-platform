from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.sensor.models.sensor_model import SensorModel 
from src.modules.threshold.models.threshold_model import ThresholdModel
from src.modules.alert.models.alert_model import AlertModel 
from src.modules.node.models.node_model import NodeModel  
from src.modules.measurement.dtos.measurement_dto import MeasurementImportDTO

# IMPORT DE VOS FONCTIONS NATIVES DEPUIS INFLUXDB.PY
from src.utils.influxdb_client import write_single_field, get_downsampled_series

class MeasurementService:  
    async def process_simulation_data(self, db: AsyncSession, dto: MeasurementImportDTO):
        """
        Traite et stocke les mesures automatiques provenant de data_sender.py (Accès public).
        Génère une alerte si les seuils configurés sur le nœud sont dépassés.
        Effectue la double-écriture en temps réel vers InfluxDB Cloud v3.
        """
        # 1. Vérification : Le nœud ciblé par l'appareil IoT existe-t-il en BDD ?
        node_query = select(NodeModel).where(NodeModel.id == dto.node_id)
        node_result = await db.execute(node_query)
        if not node_result.scalar_one_or_none():
            return None

        # 2. Recherche du capteur associé au nœud validé
        sensor_query = select(SensorModel).where(
            SensorModel.node_id == dto.node_id,
            SensorModel.name == dto.sensor_name,
            SensorModel.type == dto.type
        )
        sensor_result = await db.execute(sensor_query)
        sensor = sensor_result.scalars().first()
        
        if not sensor:
            return None

        # 3. Récupération des seuils configurés pour ce capteur précis
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
                msg = f"le capteur {dto.sensor_name} du noeud {dto.node_id} a détecté une valeur maximale qui entraîne un danger"
            
            elif dto.value < threshold.minval: 
                alert_type = "inactivity"
                msg = f"le capteur {dto.sensor_name} du noeud {dto.node_id} a détecté une valeur minimale qui entraîne l'inactivité"

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
            # 4. Enregistrement final de la nouvelle mesure IoT dans PostgreSQL (Source de vérité)
            new_measurement = MeasurementModel(
                sensor_id=sensor.id,
                value=dto.value
            )
            db.add(new_measurement)
            
            await db.commit()
            await db.refresh(new_measurement) 
            
            # 5. DOUBLE-ÉCRITURE AUTOMATIQUE EN TEMPS RÉEL VERS INFLUXDB CLOUD V3
            field_mapping = {
                "Temperature": "temperature",
                "humidity": "humidity",
                "pressure": "pressure",
                "Air Quality": "air_quality"
            }
            
            influx_field = field_mapping.get(dto.type)
            
            if influx_field:
                try:
                    # Appel de votre méthode synchrone native dans src/influxdb.py
                    write_single_field(
                        node_id=int(dto.node_id), # 1 pour SIMU, 2 pour REEL
                        field_name=influx_field,   # ex: 'temperature'
                        value=float(dto.value)     # Valeur numérique brute
                    )
                    print(f"🚀 [DOUBLE-ÉCRITURE] Succès InfluxDB v3 pour {influx_field}: {dto.value}")
                except Exception as influx_err:
                    print(f"⚠️ [DOUBLE-ÉCRITURE] Échec de l'envoi simultané InfluxDB: {influx_err}")
            
            return {"measurement": new_measurement, "alert_msg": alert_msg_final}
            
        except Exception as e:
            await db.rollback()
            print(f"❌ ERREUR COMPLÈTE ENREGISTREMENT MESURE: {e}")
            return None

    async def get_influx_series_data(self, field_name: str, period: str):
        """
        Extrait les données historiques d'InfluxDB.
        """
        return get_downsampled_series(field_name, period)

    async def get_gas_dashboard_data(self, period: str = "24h"):
        """
        Génère un dictionnaire complet contenant la dernière valeur actuelle et l'historique lissé
        pour chacun des 6 gaz afin d'alimenter directement la page frontend /Gaz.
        """
        gas_fields = {
            "CO2": "gas_co2",
            "NH3": "gas_nh3",
            "NOx": "gas_nox",
            "Alcohol": "gas_alcohol",
            "Benzene": "gas_benzene",
            "Smoke": "gas_smoke"
        }
        
        gas_dashboard_data = {}
        
        for gas_label, field_name in gas_fields.items():
            series = get_downsampled_series(field_name, period)
            current_value = series[-1]["value"] if series else 0.0
            
            gas_dashboard_data[gas_label] = {
                "current_ppm": current_value,
                "history_24h": series
            }
            
        return gas_dashboard_data
