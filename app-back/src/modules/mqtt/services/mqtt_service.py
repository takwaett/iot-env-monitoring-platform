import asyncio
from aiomqtt import Client, MqttError
from src.utils.config import settings
from src.utils.influxdb_client import write_to_influx 
from src.utils.database import AsyncSessionLocal 
from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.alert.models.alert_model import AlertModel
# Import send_alert_email si nécessaire

async def check_thresholds(temp, hum, pres, air):
    # Ta logique de seuils reste la même
    pass

async def save_to_postgres(temp, hum, pres, air):
    try:
        async with AsyncSessionLocal() as db:
            new_measurement = MeasurementModel(
                temperature=temp, humidity=hum, pressure=pres, air_quality=air, sensor_id=1 
            )
            db.add(new_measurement)
            await db.commit()
        await check_thresholds(temp, hum, pres, air)
    except Exception as e:
        print(f"❌ [POSTGRES ERROR] : {e}")

async def start_mqtt():
    """Boucle MQTT corrigée pour ne pas bloquer FastAPI"""
    reconnect_interval = 5  
    while True:
        try:
            # On vérifie que les paramètres existent dans settings
            async with Client(hostname=settings.MQTT_BROKER, port=settings.MQTT_PORT) as client:
                print(f"✅ [MQTT] Connecté au broker {settings.MQTT_BROKER}")
                await client.subscribe(settings.MQTT_TOPIC)

                async for message in client.messages:
                    payload = message.payload.decode()
                    values = payload.split(',')
                    if len(values) == 4:
                        t, h, p, a = [float(v) for v in values]
                        write_to_influx(t, h, p, a)
                        await save_to_postgres(t, h, p, a)
                            
        except MqttError as e:
            print(f"⚠️ [MQTT ERROR] Connexion impossible au broker: {e}. Nouvel essai dans {reconnect_interval}s...")
            await asyncio.sleep(reconnect_interval)
        except Exception as e:
            print(f"❌ [CRITICAL ERROR] : {e}")
            await asyncio.sleep(reconnect_interval)
