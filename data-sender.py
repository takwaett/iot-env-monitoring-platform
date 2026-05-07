import serial
import requests
import time
import sys
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

API_URL = "http://localhost:8000/measurements/data/insert"
NODE_ID = 1
SERIAL_PORT = 'COM2'
BAUD_RATE = 9600

def run_data_sender():
    print(f"🚀 [NODE:{NODE_ID}] Démarrage du simulateur sur {SERIAL_PORT}...")
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    except Exception as e:
        print(f"❌ Erreur Port : {e}")
        return

    try:
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    values = line.split(',')
                    if len(values) == 4:
                        sensors_to_send = [
                            {"sensor_name": "DHT22", "type": "Temperature", "value": float(values[0])},
                            {"sensor_name": "DHT22", "type": "Humidity", "value": float(values[1])},
                            {"sensor_name": "BMP280", "type": "Pressure", "value": float(values[2])},
                            {"sensor_name": "MQ135", "type": "Air Quality", "value": float(values[3])}
                        ]

                        for payload in sensors_to_send:
                            payload["node_id"] = NODE_ID
                            try:
                                response = requests.post(API_URL, json=payload, timeout=5)

                                if response.status_code in [200, 201]:
                                    msg = response.json().get("message", "")
                                    if msg and ("danger" in msg.lower() or "inactivity" in msg.lower()):

                                        timestamp = time.strftime("%H:%M:%S")  

                                        if "danger" in msg.lower():
                                            color = "\033[91m"  
                                            icon = "🚨"
                                            label = "DANGER CRITIQUE"
                                        else:
                                            color = "\033[93m"  
                                            icon = "⚠️"
                                            label = "AVERTISSEMENT"

                                        print(
                                            f"{color}[{timestamp}] {icon} {label} | NODE {NODE_ID} | {msg}\033[0m"
                                        )

                                    else:
                                        print(f"✅ {payload['type']} envoyé")

                                else:
                                    print(f"⚠️ Erreur API ({response.status_code}) pour {payload['type']}")

                            except Exception:
                                pass

            time.sleep(0.1)

    except Exception as e:
        print(f"❌ Erreur critique : {e}")

    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
class RestartHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(".py"):
            print("\n🔄 Modification détectée ! Redémarrage en cours...")
            os.execv(sys.executable, ['python'] + sys.argv)

if __name__ == "__main__":
    event_handler = RestartHandler()
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=False)
    observer.start()

    try:
        run_data_sender()

    except KeyboardInterrupt:
        print("\n🛑 Arrêt du simulateur...")
        observer.stop()

    observer.join()

