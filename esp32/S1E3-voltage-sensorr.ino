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

// =====================
// Analog Voltage Inputs
// =====================
const int SOLAR_ADC_PIN   = 35;   // ADC1 pin
const int BATTERY_ADC_PIN = 34;   // ADC1 pin

const float ADC_VREF = 3.3f;
const float ADC_MAX  = 4095.0f;   // 12-bit ADC

// Divider ratios: Vin = Vadc * ratio
const float SOLAR_DIV_RATIO   = 7.92f;  // e.g. 100k/15k or 220k/33k
const float BATTERY_DIV_RATIO = 7.92f;  // your 0-25V module is typically /5

// Optional calibration multipliers (tweak after comparing to a multimeter)
const float SOLAR_CAL   = 1.00f;
const float BATTERY_CAL = 1.00f;


// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Voltage Reader Starting...");

  analogReadResolution(12); // 0..4095
  // 11dB allows measuring close to ~3.3V on many ESP32 boards (good general setting)
  analogSetPinAttenuation(SOLAR_ADC_PIN, ADC_11db);
  analogSetPinAttenuation(BATTERY_ADC_PIN, ADC_11db);

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
    sendAllData();

    // Add a small random offset for the next interval (±1 minute)
    //sendInterval = BASE_SEND_INTERVAL + random(-60000, 60000);
  }
}

float readDividerVoltage(int pin, float dividerRatio, float cal) {
  // Take a small average to reduce noise (PWM controllers can be noisy)
  const int N = 20;
  uint32_t sum = 0;
  for (int i = 0; i < N; i++) {
    sum += analogRead(pin);
    delay(2);
  }
  float raw = (float)sum / (float)N;

  float v_adc = (raw / ADC_MAX) * ADC_VREF;     // volts at ADC pin
  float v_in  = v_adc * dividerRatio * cal;     // scaled back to real voltage
  return v_in;
}


// =====================
// Main Data Send
// =====================
void sendAllData() {

  float solarVoltage   = readDividerVoltage(SOLAR_ADC_PIN, SOLAR_DIV_RATIO, SOLAR_CAL);
  float batteryVoltage = readDividerVoltage(BATTERY_ADC_PIN, BATTERY_DIV_RATIO, BATTERY_CAL);
  
  long wifiConnectedS = (millis() - wifiTimeOfLastConnection) / 1000;
  long uptimeS = (millis() - lastPowerOnTime) / 1000;
  int rssi = WiFi.RSSI();

  // Build JSON payload
  String json =
    "{"
      "\"station\":\"1\","
      "\"kind\":\"esp32\","
      "\"id\":\"S1E3\","
      "\"name\":\"HLG-DC\","
      "\"meta\":{"
        "\"wifi_connected_s\":" + String(wifiConnectedS) + ","
        "\"uptime_s\":" + String(uptimeS) + ","
        "\"rssi\":" + String(rssi) + ","
        "\"solar_voltage\":" + String(solarVoltage, 2) + ","
        "\"battery_voltage\":" + String(batteryVoltage, 2) +
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
