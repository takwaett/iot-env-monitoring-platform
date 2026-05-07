#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

#define DHTPIN 12
#define DHTTYPE DHT22
#define PIN_PRESSION A0
#define PIN_AIR A1
#define PIN_LED 11
#define PIN_BUZZER 13

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);

  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  dht.begin();

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while(true);
  }

  display.clearDisplay();
  display.setTextColor(WHITE);

  Serial.println("temperature,humidite,pression,air");
}

void loop() {

  float hum = dht.readHumidity();
  float temp = dht.readTemperature();

  long pressionPa = map(analogRead(PIN_PRESSION), 0, 1023, 95000, 105000);
  int qualiteAir = map(analogRead(PIN_AIR), 0, 1023, 0, 1000);

  if (temp > 50 || hum > 60) {
    digitalWrite(PIN_LED, HIGH);
    tone(PIN_BUZZER, 1000);
  } else {
    digitalWrite(PIN_LED, LOW);
    noTone(PIN_BUZZER);
  }

  Serial.print(temp);
  Serial.print(",");

  Serial.print(hum);
  Serial.print(",");

  Serial.print(pressionPa);
  Serial.print(",");

  Serial.println(qualiteAir);

  display.clearDisplay();

  display.setTextSize(1);

  display.setCursor(0,0);
  display.print("Temp: ");
  display.print(temp,1);
  display.print(" C");

  display.setCursor(0,12);
  display.print("Hum: ");
  display.print(hum,1);
  display.print(" %");

  display.setCursor(0,24);
  display.print("Pres: ");
  display.print(pressionPa);
  display.print(" Pa");

  display.setCursor(0,36);
  display.print("Air: ");
  display.print(qualiteAir);
  display.print(" ppm");

  if(temp > 50 || hum > 60) {
    display.setCursor(0,50);
    display.print("!!! ALERTE !!!");
  }
  display.display();

  delay(100);
}   

