#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// This program allows rebooting a Raspberry Pi Zero remotely using a ESP32 module.

const char* ssid = "";
const char* password = "";
const String serverURL = "http://209.46.124.94:3000";
const String getInstructionEndpoint = "/instructions/get_instructions"; 
const String updateInstructionEndpoint = "/instructions/update_instructions/";
const String deviceID = "S1E1"; // Station 1, ESP32 1

const int RPI_RESET_PIN = 25; // GPIO pin connected to RPi reset

const unsigned long BASE_CHECK_INTERVAL = 600000; // 10 minutes
unsigned long lastCheckTime = 0;
unsigned long checkInterval = BASE_CHECK_INTERVAL;

void setup() {
  Serial.begin(115200);
  pinMode(RPI_RESET_PIN, OUTPUT);
  digitalWrite(RPI_RESET_PIN, HIGH); // Pull high normally

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi");
  Serial.println("IP Address: " + WiFi.localIP().toString());
}

void loop() {
  if (millis() - lastCheckTime >= checkInterval) {
    lastCheckTime = millis();
    checkForInstructions();

    // Add a small random offset for the next interval (±1 minute)
    checkInterval = BASE_CHECK_INTERVAL + random(-60000, 60000); // 10 min ± 1 min
  }
}

void checkForInstructions() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  String url = serverURL + getInstructionEndpoint;
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("Server response: " + payload);

    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      for (JsonObject instr : doc.as<JsonArray>()) {
        String target = instr["instruction_target"];
        String type = instr["instruction_type"];
        String instrID = instr["_id"];

        // Only check for reboot instructions targeted to this device
        if (target == deviceID && type == "reboot") {
          bool alreadyDone = false;

          // Check station1_complete for your ESP32
          if (instr.containsKey("station1_complete")) {
            alreadyDone = instr["station1_complete"];
          }

          if (!alreadyDone) {
            Serial.println("Reboot instruction received! Resetting RPi...");
            triggerRpiReset();

            // Mark station1_complete as true
            markInstructionComplete(instrID);
          } else {
            Serial.println("Instruction already completed for station1, skipping.");
          }
        }
      }
    } else {
      Serial.println("JSON parsing error: " + String(error.c_str()));
    }
  } else {
    Serial.println("Error fetching instructions, HTTP code: " + String(httpCode));
  }

  http.end();
}


void triggerRpiReset() {
  digitalWrite(RPI_RESET_PIN, LOW); // Pull reset pin low
  delay(500); // Hold low for 500ms
  digitalWrite(RPI_RESET_PIN, HIGH); // Release reset
  Serial.println("RPI reset pulse sent!");
}

void markInstructionComplete(String instructionID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Cannot mark instruction complete.");
    return;
  }

  HTTPClient http;
  String url = serverURL + updateInstructionEndpoint + instructionID; 
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Mark station1_complete as true
  String payload = "{\"station1_complete\":true}";

  int httpCode = http.PUT(payload);

  if (httpCode > 0) {
    Serial.println("Instruction marked complete. HTTP code: " + String(httpCode));
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error marking instruction complete, HTTP code: " + String(httpCode));
  }

  http.end();
}

