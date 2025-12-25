#include <Wire.h>
#include <HTTPClient.h>
#include <WiFi.h>

// This program reads the voltage of a solar panel and battery and sends it to a server. 

// =====================
// Configuration
// =====================
const char* ssid = "";
const char* password = "";

String host = "www.litenby.com";
const int serverPort = 80;
const char* PATH_UPDATE = "/sound-locator/api/node/update";

// =====================
// Timing
// =====================
const unsigned long BASE_SEND_INTERVAL = 300000UL;       // 5 minutes
const unsigned long RESTART_INTERVAL = 86400000UL;       // 24 hours
unsigned long lastSendTime = 0;
unsigned long sendInterval = BASE_SEND_INTERVAL;         // Will vary with random offset

// =====================
// Globals
// =====================

unsigned long lastRestartTime = 0;
unsigned long lastPowerOnTime = 0;
unsigned long wifiTimeOfLastConnection = 0;
float voltage_to_send = 0;

// =====================
// Analog Voltage Inputs
// =====================
const int MQ135_PIN = 35;

const float ADC_VREF = 3.3;     // ESP32 ADC reference
const float ADC_MAX = 4095.0;   // 12-bit ADC

// Divider ratio = (18k + 33k) / 33k
const float DIV_RATIO = (18.0 + 33.0) / 33.0;   // ≈ 1.545

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  Serial.println("MQ-135 Reader Starting...");

  lastPowerOnTime = millis();
  lastRestartTime = millis();

  connectToWiFi();

}

// =====================
// Loop
// =====================
void loop() {
  checkWiFiConnection();
  checkRestartESP32();

  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    int raw = analogRead(MQ135_PIN);

    // Voltage seen at the ESP32 pin
    float v_adc = (raw / ADC_MAX) * ADC_VREF;

    // Actual AO voltage from the sensor
    float v_sensor = v_adc * DIV_RATIO;
    voltage_to_send = v_sensor;
    sendAllData();

    // Add a small random offset for the next interval (±1 minute)
    //sendInterval = BASE_SEND_INTERVAL + random(-60000, 60000);
  }
}

// =====================
// Main Data Send
// =====================
void sendAllData() {
  
  long wifiConnectedS = (millis() - wifiTimeOfLastConnection) / 1000;
  long uptimeS = (millis() - lastPowerOnTime) / 1000;
  int rssi = WiFi.RSSI();

  // Build JSON payload
  String json =
    "{"
      "\"station\":\"1\","
      "\"kind\":\"esp32\","
      "\"id\":\"S1E4\","
      "\"name\":\"MQ-135\","
      "\"meta\":{"
        "\"wifi_connected_s\":" + String(wifiConnectedS) + ","
        "\"uptime_s\":" + String(uptimeS) + ","
        "\"rssi\":" + String(rssi) + ","
        "\"mq_135_voltage\":" + String(voltage_to_send, 2) + ","
      "}"
    "}";

  sendJsonPost(PATH_UPDATE, json);
}


// =====================
// HTTP Helpers
// =====================

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
