#include <DHT.h>

// DHT22 sur pin 23
#define DHT_PIN 23  
#define DHT_TYPE DHT22

// MQ135 sur pin 34
#define MQ135_PIN 34

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  
  // Configuration des broches
  pinMode(MQ135_PIN, INPUT);
  
  Serial.println("=== SYSTEME DEMARRE ===");
  Serial.print("DHT22 sur pin ");
  Serial.println(DHT_PIN);
  Serial.print("MQ135 sur pin ");
  Serial.println(MQ135_PIN);
  Serial.println("");
  
  dht.begin();
  delay(3000);
}

void loop() {
  delay(2000);
  
  // Lecture DHT22
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Lecture MQ135
  int airQuality = analogRead(MQ135_PIN);
  
  // Test DHT22
  if (isnan(temperature)) {
    Serial.print("❌ DHT22 echec sur pin ");
    Serial.println(DHT_PIN);
  } else {
    Serial.print("✅ DHT22 OK - Temp: ");
    Serial.print(temperature);
    Serial.print("°C, Hum: ");
    Serial.print(humidity);
    Serial.println("%");
  }
  
  // Test MQ135
  Serial.print("📊 MQ135 - Qualite air: ");
  Serial.println(airQuality);
  
  // Format CSV pour Python (temp,hum,0.0,air)
  Serial.println("--- CSV ---");
  if (!isnan(temperature)) {
    Serial.print(temperature);
  } else {
    Serial.print("0.0");
  }
  Serial.print(",");
  if (!isnan(humidity)) {
    Serial.print(humidity);
  } else {
    Serial.print("0.0");
  }
  Serial.print(",0.0,");
  Serial.println(airQuality);
  Serial.println("");
}