#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =====================
// Configuration
// =====================
const char* ssid = "";
const char* password = "";

const char* DEVICE_LOCATION = "Station 1";
const char* DEVICE_NAME = "S1E1";

String ipAddress = "209.46.124.94";
const int serverPort = 3000;

const String serverURL = "http://209.46.124.94:3000";
const String getInstructionEndpoint = "/instructions/get_instructions";
const String updateInstructionEndpoint = "/instructions/update_instructions/";

const String deviceID = "S1E1";

const int RPI_RESET_PIN = 25;

// Timing
const unsigned long BASE_CHECK_INTERVAL = 600000UL; // 10 min
const unsigned long RESTART_INTERVAL = 86400000UL;  // 24 hours

unsigned long lastCheckTime = 0;
unsigned long checkInterval = BASE_CHECK_INTERVAL;
unsigned long lastRestartTime = 0;
unsigned long lastPowerOnTime = 0;
unsigned long wifiTimeOfLastConnection = 0;

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 RPi Reboot Controller Starting...");

  pinMode(RPI_RESET_PIN, OUTPUT);
  digitalWrite(RPI_RESET_PIN, HIGH);

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

  if (millis() - lastCheckTime >= checkInterval) {
    lastCheckTime = millis();

    checkForInstructions();
    sendAllData();

    checkInterval = BASE_CHECK_INTERVAL + random(-60000, 60000);
  }
}

// =====================
// Instruction Handling
// =====================
void checkForInstructions() {
  HTTPClient http;
  http.begin(serverURL + getInstructionEndpoint);

  int httpCode = http.GET();
  if (httpCode <= 0) {
    Serial.println("Instruction fetch failed");
    http.end();
    return;
  }

  DynamicJsonDocument doc(2048);
  deserializeJson(doc, http.getString());

  for (JsonObject instr : doc.as<JsonArray>()) {
    if (instr["instruction_target"] == deviceID &&
        instr["instruction_type"] == "reboot" &&
        !instr["station1_complete"]) {

      Serial.println("Reboot instruction received");
      triggerRpiReset();
      markInstructionComplete(instr["_id"]);
    }
  }

  http.end();
}

void triggerRpiReset() {
  digitalWrite(RPI_RESET_PIN, LOW);
  delay(500);
  digitalWrite(RPI_RESET_PIN, HIGH);
  Serial.println("RPi reset triggered");
}

void markInstructionComplete(String instructionID) {
  HTTPClient http;
  http.begin(serverURL + updateInstructionEndpoint + instructionID);
  http.addHeader("Content-Type", "application/json");

  http.PUT("{\"station1_complete\":true}");
  http.end();
}

// =====================
// Data Reporting
// =====================
void sendAllData() {
  sendEventData(
    DEVICE_LOCATION,
    DEVICE_NAME,
    "Wifi Uptime",
    updateWiFiConnectedTimeString(),
    "Time"
  );

  sendEventData(
    DEVICE_LOCATION,
    DEVICE_NAME,
    "System Uptime",
    updateUptimeString(),
    "Time"
  );
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

void sendPostRequest(const char* path, String payload) {
  HTTPClient http;
  if (http.begin(ipAddress.c_str(), serverPort, path)) {
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    http.POST(payload);
    http.end();
  }
}

// =====================
// WiFi
// =====================
void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  wifiTimeOfLastConnection = millis();
  Serial.println("\nWiFi connected");
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
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
  return String(t / 86400000UL) + "d " +
         twoDigits((t / 3600000UL) % 24) + ":" +
         twoDigits((t / 60000UL) % 60) + ":" +
         twoDigits((t / 1000UL) % 60);
}
