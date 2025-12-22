#include <Wire.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Adafruit_INA219.h>

// This program reads the voltage of a solar panel and battery and sends it to a server. 

// =====================
// Configuration
// =====================
const char* ssid = "";
const char* password = "";

const char* DEVICE_LOCATION = "Station 1";
const char* DEVICE_NAME = "S1E3";
const char* SENSOR_NAME = "INA219";

String ipAddress = "209.46.124.94";
const int serverPort = 3000;

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
Adafruit_INA219 solarPanelINA;        // Default address 0x40
Adafruit_INA219 batteryINA(0x44);     // Second INA219

unsigned long lastRestartTime = 0;
unsigned long lastPowerOnTime = 0;
unsigned long wifiTimeOfLastConnection = 0;

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 INA219 Starting...");

  lastPowerOnTime = millis();
  lastRestartTime = millis();

  Wire.begin();  // Initialize I2C

  connectToWiFi();

  if (!solarPanelINA.begin()) {
    Serial.println("Failed to find Solar INA219");
  }
  if (!batteryINA.begin()) {
    Serial.println("Failed to find Battery INA219");
  }

  // Calibration (adjust if needed)
  solarPanelINA.setCalibration_32V_2A();
  batteryINA.setCalibration_32V_2A();
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

  float solarVoltage = solarPanelINA.getBusVoltage_V();
  float batteryVoltage = batteryINA.getBusVoltage_V();

  // Clamp to 0-25V for logging in cold weather
  if (isnan(solarVoltage) || solarVoltage < 0.0 || solarVoltage > 25.0) {
      Serial.println("Solar panel voltage out of expected range, logging as 0V");
      solarVoltage = 0.0;
  }
  sendData(DEVICE_LOCATION, DEVICE_NAME, SENSOR_NAME, "solar_voltage", String(solarVoltage, 2), "Volts");

  if (isnan(batteryVoltage) || batteryVoltage < 0.0 || batteryVoltage > 25.0) {
      Serial.println("Battery voltage out of expected range, logging as 0V");
      batteryVoltage = 0.0;
  }
  sendData(DEVICE_LOCATION, DEVICE_NAME, SENSOR_NAME, "battery_voltage", String(batteryVoltage, 2), "Volts");

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
