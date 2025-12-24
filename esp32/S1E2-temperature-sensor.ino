#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// This program sends the temperature and other weather data to a remote server. 

// =====================
// Configuration
// =====================
#define DHT_PIN 5
#define DHT_TYPE DHT22

const char* ssid = "";
const char* password = "";

String host = "www.litenby.com";
const int serverPort = 80;
const char* PATH_UPDATE = "/sound-locator/api/node/update";

// Timing
const unsigned long BASE_SEND_INTERVAL = 10000UL;       // 10 minutes
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
    //sendInterval = BASE_SEND_INTERVAL + random(-60000, 60000);
  }
}

// =====================
// Main Data Send
// =====================
void sendAllData() {
  // compute strings
  String wifiUptime = updateWiFiConnectedTimeString();
  String systemUptime = updateUptimeString();

  // read sensor
  float tempC = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (isnan(tempC) || isnan(humidity)) return;

  float tempF = (tempC * 9.0 / 5.0) + 32.0;
  float dewPointF = (computeDewPoint(tempC, humidity) * 9.0 / 5.0) + 32.0;
  float heatIndexF = (computeHeatIndex(tempC, humidity) * 9.0 / 5.0) + 32.0;

  long wifiConnectedS = (millis() - wifiTimeOfLastConnection) / 1000;
  long uptimeS = (millis() - lastPowerOnTime) / 1000;
  int rssi = WiFi.RSSI();

  // Build JSON payload
  String json =
    "{"
      "\"station\":\"1\","
      "\"kind\":\"esp32\","
      "\"id\":\"S1E2\","
      "\"name\":\"DHT22\","
      "\"meta\":{"
        "\"wifi_connected_s\":" + String(wifiConnectedS) + ","
        "\"uptime_s\":" + String(uptimeS) + ","
        "\"rssi\":" + String(rssi) + ","
        "\"interior_temp_f\":" + String(tempF, 2) + ","
        "\"interior_humidity_pct\":" + String(humidity, 2) + ","
        "\"interior_dew_point_f\":" + String(dewPointF, 2) + ","
        "\"interior_heat_index_f\":" + String(heatIndexF, 2) +
      "}"
    "}";

  sendJsonPost(PATH_UPDATE, json);
}

void sendJsonPost(const char* path, String json) {
  HTTPClient http;
  if (http.begin(host, serverPort, path)) {
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(json);

    Serial.printf("HTTP POST %s -> %d\n", path, code);
    String resp = http.getString();
    Serial.println(resp);

    http.end();
  } else {
    Serial.println("http.begin() failed");
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