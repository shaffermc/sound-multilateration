#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "x";
const char* password = "x";
const String serverURL = "http://209.46.124.94:3000/instructions/get_instructions"; 
const String deviceID = "S1E1"; //Station 1, ESP32 1

const int RPI_RESET_PIN = 25; // GPIO pin connected to RPi reset

unsigned long lastCheckTime = 0;
const unsigned long CHECK_INTERVAL = 60000; // Check every 60 seconds

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
  if (millis() - lastCheckTime >= CHECK_INTERVAL) {
    lastCheckTime = millis();
    checkForInstructions();
  }
}

void checkForInstructions() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(serverURL);
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("Server response: " + payload);

    // Parse JSON
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      for (JsonObject instr : doc.as<JsonArray>()) {
        String target = instr["instruction_target"];
        String type = instr["instruction_type"];
        String instrID = instr["_id"]; // Get the instruction ID from the JSON

        if (target == deviceID && type == "reboot") {
          Serial.println("Reboot instruction received! Resetting RPi...");
          triggerRpiReset();

          // Mark this instruction as complete
          markInstructionComplete(instrID);
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
  String url = "http://209.46.124.94:3000/instructions/update_instructions/" + instructionID;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Use deviceID as the key in the JSON payload
  String payload = "{\"" + deviceID + "\":true}";

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
