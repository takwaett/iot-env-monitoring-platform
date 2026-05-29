import serial
import requests
import time
import sys
import os
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

API_URL = "http://localhost:8000/measurements/data/insert"

PORTS_CONFIG = [
    {'port': 'COM2', 'baud': 9600, 'label': 'SIMU', 'node_id': 1},
    {'port': 'COM3', 'baud': 115200, 'label': 'REEL', 'node_id': 2}
]

# ALIGNEMENT STRICT AVEC LA BASE DE DONNÉES
# id 15 = humidity, id 16 = Air Quality, id 17 = pressure, id 18 = Temperature
SENSOR_TYPES = {
    1: {  # SIMU
        "temperature": "Temperature",
        "humidity": "humidity",
        "pressure": "pressure",
        "air_quality": "Air Quality"
    },
    2: {  # REEL
        "temperature": "Temperature",
        "humidity": "humidity", 
        "pressure": "pressure", 
        "air_quality": "Air Quality"
    }
}

def handle_serial_port(port_name, baud_rate, label, node_id):
    print(f"🚀 [{label}] Démarrage sur {port_name} avec node_id={node_id}...")
    
    try:
        ser = serial.Serial(port_name, baud_rate, timeout=1)
        ser.reset_input_buffer()
        print(f"✅ [{label}] Connecté à {port_name}")
    except serial.SerialException as e:
        print(f"⚠️ [{label}] Port {port_name} non disponible: {e}")
        return
    except Exception as e:
        print(f"❌ [{label}] Erreur inattendue: {e}")
        return

    data_count = 0
    error_count = 0
    
    try:
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                
                if not line:
                    continue
                
                print(f"[{label}] RAW: {line}")
                
                has_data_prefix = "DATA:" in line
                comma_count = line.count(',')
                
                if not has_data_prefix and comma_count < 3:
                    continue
                
                data_line = line
                if has_data_prefix:
                    data_line = line.split("DATA:")[1].strip()
                
                values = [v.strip() for v in data_line.split(',')]
                
                if len(values) != 4:
                    print(f"⚠️ [{label}] Format invalide: {len(values)} valeurs (ignoré)")
                    continue
                
                try:
                    # CORRECTION : Restauration des index numériques des variables
                    temperature = float(values[0])
                    humidity = float(values[1])
                    pressure = float(values[2])
                    air_quality = float(values[3])
                    
                    data_count += 1
                    print(f"\n📊 [{label}] MESURE #{data_count}:")
                    print(f"   🌡️ Température: {temperature}°C")
                    print(f"   💧 Humidité: {humidity}%")
                    print(f"   📊 Pression: {pressure} Pa")
                    print(f"   🌫️ Qualité air: {air_quality}")
                    
                    types = SENSOR_TYPES.get(node_id, {})
                    
                    measures = [
                        ("DHT22", types.get("temperature"), temperature, "Température"),
                        ("DHT22", types.get("humidity"), humidity, "Humidité"),
                        ("BMP280", types.get("pressure"), pressure, "Pression"),
                        ("MQ135", types.get("air_quality"), air_quality, "Qualité d'air")
                    ]
                    
                    for sensor_name, measure_type, value, description in measures:
                        if measure_type is None:
                            print(f"⚠️ [{label}] Type non trouvé pour {description} (node_id={node_id})")
                            continue
                        
                        payload = {
                            "node_id": node_id,
                            "value": value,
                            "sensor_name": sensor_name,
                            "type": measure_type
                        }
                        
                        print(f"📤 [{label}] Envoi: {payload}")
                        
                        try:
                            response = requests.post(API_URL, json=payload, timeout=5)
                            if response.status_code == 201:
                                print(f"✅ [{label}] {description}: {value} → OK")
                            else:
                                print(f"⚠️ [{label}] {description}: HTTP {response.status_code}")
                                print(f"   Réponse: {response.text}")
                        except requests.exceptions.ConnectionError:
                            print(f"🌐 [{label}] IMPOSSIBLE DE CONTACTER L'API!")
                            print(f"   Vérifiez que FastAPI tourne sur http://localhost:8000")
                        except Exception as e:
                            print(f"🌐 [{label}] Erreur envoi {description}: {e}")
                            error_count += 1
                    
                    print(f"---")
                    
                except ValueError as e:
                    print(f"❌ [{label}] Erreur conversion: {e}")
                    print(f"   Valeurs reçues: {values}")
                    error_count += 1
                    continue
                
            time.sleep(0.01)
            
    except Exception as e:
        print(f"❌ [{label}] Erreur critique: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print(f"[{label}] Port série fermé")

class RestartHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(".py"):
            print("\n🔄 Code modifié ! Redémarrage...")
            time.sleep(1)
            os.execv(sys.executable, ['python'] + sys.argv)

if __name__ == "__main__":
    print("=" * 60)
    print("📡 DATA SENDER - CONFIGURATION TERMINÉE")
    print("=" * 60)
    
    print("\n🔍 Vérification de la connexion à l'API...")
    try:
        response = requests.get("http://localhost:8000/docs", timeout=3)
        if response.status_code == 200:
            print("✅ Serveur FastAPI accessible")
        else:
            print(f"⚠️ API répond mais code {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Serveur FastAPI non accessible!")
        print("   Démarrez-le avec: uvicorn main:app --reload --port 8000")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erreur: {e}")
        sys.exit(1)
    
    try:
        event_handler = RestartHandler()
        observer = Observer()
        observer.schedule(event_handler, path='.', recursive=False)
        observer.start()
        print("👁️ Watchdog activé")
    except Exception as e:
        print(f"⚠️ Watchdog non disponible: {e}")
        observer = None
    
    print("\n📡 Démarrage des threads série...")
    for config in PORTS_CONFIG:
        t = threading.Thread(target=handle_serial_port, args=(
            config['port'], 
            config['baud'], 
            config['label'], 
            config['node_id']
        ))
        t.daemon = True
        t.start()
        time.sleep(0.5)
    
    print(f"\n🎯 Traitement en cours...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nArrêt du script.")
