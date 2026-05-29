import os
import json
import math
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from dotenv import load_dotenv
from pathlib import Path

# Charger le fichier .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configuration InfluxDB depuis .env
URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
TOKEN = os.getenv("INFLUXDB_TOKEN")
ORG = os.getenv("INFLUXDB_ORG", "PFE_IoT")
BUCKET = os.getenv("INFLUXDB_BUCKET", "iot_data")

if not TOKEN:
    raise ValueError("❌ INFLUXDB_TOKEN non trouvé dans le fichier .env")

print(f"✅ InfluxDB configuré : {URL}")
print(f"   Organisation: {ORG}")
print(f"   Bucket: {BUCKET}")

# Initialiser le client
client = InfluxDBClient(url=URL, token=TOKEN, org=ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)

# =========================================================================
# CONFIGURATION DES COURBES DU MQ135 (Formule : ppm = a * (Rs/R0)^b)
# =========================================================================
MQ135_CURVES = {
    "gas_nh3": {"a": 102.2, "b": -2.473},
    "gas_nox": {"a": 44.65, "b": -3.421},
    "gas_alcohol": {"a": 76.63, "b": -3.235},
    "gas_benzene": {"a": 21.34, "b": -2.521},
    "gas_smoke": {"a": 31.95, "b": -2.502},
    "gas_co2": {"a": 110.47, "b": -2.862}
}

def compute_gas_ppm(raw_air_quality, gas_name):
    """
    Calcule la concentration en ppm pour un gaz donné.
    Gère les valeurs brutes de type résistance (ex: 98870).
    """
    try:
        val = float(raw_air_quality)
        if val <= 0:
            return 0.0
        
        # Calibration dynamique du ratio Rs/R0 selon l'échelle reçue
        if val > 5000:
            r0_reference = 76000.0  # Résistance théorique MQ135 dans l'air pur
            rs_ro_ratio = val / r0_reference
        elif val > 10:
            rs_ro_ratio = val / 100.0
        else:
            rs_ro_ratio = val
            
        if rs_ro_ratio <= 0:
            rs_ro_ratio = 0.1
            
        curve = MQ135_CURVES[gas_name]
        ppm = curve["a"] * math.pow(rs_ro_ratio, curve["b"])
        return round(ppm, 2)
    except Exception:
        return 0.0

# =========================================================================

def write_sensor_data(node_id, temperature, humidity, pressure, air_quality):
    """
    Écrit les données d'un capteur dans InfluxDB avec le détail des 6 gaz.
    """
    try:
        node_id_str = str(node_id)
        node_label = "SIMU" if node_id_str == "1" else "REEL" if node_id_str == "2" else "Other"
        temp = float(temperature)
        hum = float(humidity)
        pres = float(pressure)
        air = float(air_quality)
        
        point = Point("environment_metrics") \
            .tag("node_id", node_id_str) \
            .tag("node_label", node_label) \
            .tag("sensor_type", "dht22_mq135") \
            .field("temperature", temp) \
            .field("humidity", hum) \
            .field("pressure", pres) \
            .field("air_quality", air)
        
        for gas_field in MQ135_CURVES.keys():
            calculated_ppm = compute_gas_ppm(air, gas_field)
            point.field(gas_field, float(calculated_ppm))
        
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        return True
    except Exception as e:
        print(f"❌ [INFLUXDB] Erreur écriture: {e}")
        return False

def write_single_field(node_id, field_name, value):
    """
    Écrit un seul champ et calcule automatiquement les 6 gaz si le champ est air_quality.
    """
    try:
        node_id_str = str(node_id)
        node_label = "SIMU" if node_id_str == "1" else "REEL" if node_id_str == "2" else "Other"
        val_float = float(value)

        point = Point("environment_metrics") \
            .tag("node_id", node_id_str) \
            .tag("node_label", node_label) \
            .field(field_name, val_float)
        
        # Injection et calcul instantané des 6 gaz lors de la réception de la qualité de l'air
        if field_name == "air_quality":
            for gas_field in MQ135_CURVES.keys():
                calculated_ppm = compute_gas_ppm(val_float, gas_field)
                point.field(gas_field, float(calculated_ppm))
        
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        return True
    except Exception as e:
        print(f"❌ [INFLUXDB] Erreur écriture champ {field_name}: {e}")
        return False

def test_connection():
    """Test la connexion à InfluxDB"""
    try:
        test_point = Point("test") \
            .tag("test", "connection") \
            .field("value", 1)
        
        write_api.write(bucket=BUCKET, org=ORG, record=test_point)
        print("✅ Test InfluxDB réussi !")
        return True
    except Exception as e:
        print(f"❌ Test InfluxDB échoué: {e}")
        return False

def close_influx():
    """Ferme la connexion InfluxDB"""
    if client:
        client.close()
        print("🔌 Connexion InfluxDB fermée")

def get_downsampled_series(field_name: str, period: str):
    """
    Récupère la série temporelle d'un champ spécifique via une requête Flux stable.
    """
    mapping = {
        "30m": {"interval": "30m", "window": "30s"},
        "1h": {"interval": "1h", "window": "1m"},
        "24h": {"interval": "24h", "window": "5m"},
        "7d": {"interval": "7d", "window": "30m"}
    }
    
    config = mapping.get(period, mapping["30m"])
    
    flux_query = f'''
    from(bucket: "{BUCKET}")

      |> range(start: -{config["interval"]})
      |> filter(fn: (r) => r["_measurement"] == "environment_metrics")
      |> filter(fn: (r) => r["_field"] == "{field_name}")

      |> aggregateWindow(every: {config["window"]}, fn: mean, createEmpty: false)
      |> yield(name: "mean")
    '''
    
    try:
        query_api = client.query_api()
        result = query_api.query(org=ORG, query=flux_query)
        
        series = []
        for table in result:
            for record in table.records:
                t = record.get_time()
                v = record.get_value()
                
                if t and v is not None:
                    time_str = t.isoformat() if hasattr(t, 'isoformat') else str(t)
                    series.append({
                        "time": time_str,
                        "value": round(float(v), 2)
                    })
        return series
    except Exception as e:
        print(f"❌ [INFLUXDB] Erreur lors de la récupération de la série {field_name}: {e}")
        return []
