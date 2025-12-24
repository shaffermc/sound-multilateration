#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// This program sends the temperature and other weather data to a remote server. 

// =====================
// Configuration
// =====================
#define DHT_PIN 5
#define DHT_TYPE DHT22

const char* ssid = "x";
const char* password = "x";

const char* DEVICE_LOCATION = "Station 1";
const char* DEVICE_NAME = "S1E2";
const char* SENSOR_NAME = "DHT22";

String ipAddress = "209.46.124.94";
const int serverPort = 3000;

// Timing
const unsigned long BASE_SEND_INTERVAL = 600000UL;       // 10 minutes
const unsigned long RESTART_INTERVAL = 86400000UL;       // 24 hours
unsigned long lastSendTime = 0;
unsigned long sendInterval = BASE_SEND_INTERVAL;         // Will vary with random offset

// Dew point constants
const float A = 17.271;
const float B = 237.7;

// =====================
// Globals
// =====================
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastRestartTime = 0;
unsigned long lastPowerOnTime = 0;
unsigned long wifiTimeOfLastConnection = 0;

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 DHT22 Starting...");

  lastPowerOnTime = millis();
  lastRestartTime = millis();

  connectToWiFi();
  dht.begin();
}

// =====================
// Loop
// =====================
void loop() {
  checkWiFiConnection();
  checkRestartESP32();

  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    sendAllData();

    // Add a small random offset for the next interval (±1 minute)
    sendInterval = BASE_SEND_INTERVAL + random(-60000, 60000);
  }
}

// =====================
// Main Data Send
// =====================
void sendAllData() {
  String wifiUptime = updateWiFiConnectedTimeString();
  String systemUptime = updateUptimeString();

  sendEventData(DEVICE_LOCATION, DEVICE_NAME, "Wifi Uptime", wifiUptime, "Time");
  sendEventData(DEVICE_LOCATION, DEVICE_NAME, "System Uptime", systemUptime, "Time");

  float tempC = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(tempC) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor");
    return;
  }

  float tempF = (tempC * 9.0 / 5.0) + 32.0;
  sendData(DEVICE_LOCATION, DEVICE_NAME, SENSOR_NAME, "Temperature", String(tempF, 2), "Fahrenheit");

  sendData(DEVICE_LOCATION, DEVICE_NAME, SENSOR_NAME, "Humidity", String(humidity, 2), "percent");

  float dewPointC = computeDewPoint(tempC, humidity);
  float dewPointF = (dewPointC * 9.0 / 5.0) + 32.0;
  sendData(DEVICE_LOCATION, DEVICE_NAME, SENSOR_NAME, "Dew Point", String(dewPointF, 2), "Fahrenheit");

  float heatIndexC = computeHeatIndex(tempC, humidity);
  float heatIndexF = (heatIndexC * 9.0 / 5.0) + 32.0;
  sendData(DEVICE_LOCATION, DEVICE_NAME, SENSOR_NAME, "Heat Index", String(heatIndexF, 2), "Fahrenheit");
}

// =====================
// HTTP Helpers
// =====================
void sendEventData(String location, String name, String type, String value, String units) {
  String data =
    "esp32_location=" + location +
    "&esp32_name=" + name +
    "&esp32_event_type=" + type +
    "&esp32_event_value=" + value +
    "&esp32_event_units=" + units;

  sendPostRequest("/esp32/add_esp32_event", data);
}

void sendData(String location, String name, String sensor, String readingType, String value, String units) {
  String data =
    "esp32_location=" + location +
    "&esp32_name=" + name +
    "&esp32_sensor_type=" + readingType +
    "&esp32_sensor_reading=" + value +
    "&esp32_sensor_units=" + units;

  sendPostRequest("/esp32/add_esp32_data", data);
}

void sendPostRequest(const char* path, String payload) {
  HTTPClient http;

  if (http.begin(ipAddress.c_str(), serverPort, path)) {
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    int code = http.POST(payload);

    Serial.print("HTTP ");
    Serial.print(path);
    Serial.print(" -> ");
    Serial.println(code);

    http.end();
  } else {
    Serial.println("HTTP begin failed");
  }
}

// =====================
// WiFi
// =====================
void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
    attempts++;
    if (attempts > 20) {
      Serial.println("\nWiFi failed, restarting...");
      ESP.restart();
    }
  }

  wifiTimeOfLastConnection = millis();
  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost, reconnecting...");
    connectToWiFi();
  }
}

// =====================
// Restart Logic
// =====================
void checkRestartESP32() {
  if (millis() - lastRestartTime >= RESTART_INTERVAL) {
    ESP.restart();
  }
}

// =====================
// Time Helpers
// =====================
String twoDigits(unsigned long n) {
  return (n < 10) ? "0" + String(n) : String(n);
}

String updateWiFiConnectedTimeString() {
  unsigned long t = millis() - wifiTimeOfLastConnection;
  return twoDigits((t / 3600000) % 24) + ":" +
         twoDigits((t / 60000) % 60) + ":" +
         twoDigits((t / 1000) % 60);
}

String updateUptimeString() {
  unsigned long t = millis() - lastPowerOnTime;
  unsigned long days = t / 86400000UL;
  unsigned long hours = (t / 3600000UL) % 24;
  unsigned long minutes = (t / 60000UL) % 60;
  unsigned long seconds = (t / 1000UL) % 60;

  return String(days) + "d " +
         twoDigits(hours) + ":" +
         twoDigits(minutes) + ":" +
         twoDigits(seconds);
}

float computeDewPoint(float temperature_C, float humidity) {
  float gamma = (A * temperature_C) / (B + temperature_C) + log(humidity / 100.0);
  float dewPoint_C = (B * gamma) / (A - gamma);
  return dewPoint_C;
}

float computeHeatIndex(float temperature, float humidity) {
  float c1, c2, c3, c4, c5, c6, c7, c8, c9;
  
  // Coefficients for Celsius
  c1 = -8.78469475556;
  c2 = 1.61139411;
  c3 = 2.33854883889;
  c4 = -0.14611605;
  c5 = -0.012308094;
  c6 = -0.0164248277778;
  c7 = 0.002211732;
  c8 = 0.00072546;
  c9 = -0.000003582;
  
  float HI = c1 + c2 * temperature + c3 * humidity + c4 * temperature * humidity + c5 * temperature * temperature + c6 * humidity * humidity + c7 * temperature * temperature * humidity + c8 * temperature * humidity * humidity + c9 * temperature * temperature * humidity * humidity;
  
  return HI;
}