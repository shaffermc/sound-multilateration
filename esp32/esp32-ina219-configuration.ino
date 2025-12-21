#include <Wire.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Adafruit_INA219.h>

// This code sends two voltage readings to an Express server every 10 minutes.
// It uses an ESP32-WROOM-DA module and two INA219 sensors.

const char* ssid = "x";
const char* password = "x";

// Create INA219 objects for both modules
Adafruit_INA219 solarPanelINA;
Adafruit_INA219 batteryINA(0x41);  // Second INA219 with I2C address 0x41

unsigned long uptime = 0;
unsigned long lastPowerOnTime = 0;
unsigned long wifiUptime = 0;
unsigned long wifiTimeOfLastConnection = 0;
 
unsigned long lastRestartTime = 0;
const unsigned long restartInterval = 86400000; // Restart every day

String ipAddress = "209.46.124.94"; // Variable to store the IP address

void setup() {

  Serial.begin(9600);
  lastPowerOnTime = millis();
  // Connect to Wi-Fi
  connectToWiFi();
  // Initialize both INA219 modules
  solarPanelINA.begin();   // Solar panel module
  batteryINA.begin();      // Battery module

  Serial.println("Starting INA219 readings...");

}

void loop() {
  
  checkWiFiConnection();
  
    String wifiUptimeToSend = updateWiFiConnectedTimeString();
    String esp32UptimeToSend = updateUptimeString();
    sendEventData("Station 1", "ESP32-12", "Wifi Uptime", wifiUptimeToSend, "Time");
    sendEventData("Station 1", "ESP32-12", "System Uptime", esp32UptimeToSend, "Time");


    float solarVoltage = solarPanelINA.getBusVoltage_V();
    float batteryVoltage = batteryINA.getBusVoltage_V();

  if (solarVoltage != 0xFFFF) {
    Serial.println("Sending Solar Panel Voltage Data..");
    sendData("ESP32-12", "INA219", "Solar Panel Voltage", String(solarVoltage, 2), "Volts");
  } else {
    Serial.println("Failed to read voltage from INA219 sensor. Please check wiring.");
  }

  if (batteryVoltage != 0xFFFF) {
    Serial.println("Sending Battery Voltage Data..");
    sendData("ESP32-12", "INA219", "Battery Voltage", String(batteryVoltage, 2), "Volts");
  } else {
    Serial.println("Failed to read voltage from INA219 sensor. Please check wiring.");
  }

  int count = 600;
  while (count > 0) {
    Serial.println(count);
    count = count - 1;
    delay(1000);
  }
}

void sendEventData(String esp32_location, String esp32_name, String esp32_event_type, String esp32_event_value, String esp32_event_units) {
  String data = "esp32_location=" + esp32_location + "&esp32_name=" + esp32_name + "&esp32_event_type=" + esp32_event_type + "&esp32_event_value=" + esp32_event_value +"&esp32_event_units=" + esp32_event_units;
  Serial.println(data);
  sendPostRequestSensorEvent(data);
}

void sendData(String esp32_location, String esp32_name, String esp32_sensor_type, String esp32_sensor_reading, String esp32_sensor_units) {
  String data = "esp32_location=" + esp32_location + "&esp32_name=" + esp32_name + "&esp32_sensor_type=" + esp32_sensor_type + "&esp32_sensor_reading=" + esp32_sensor_reading + "&esp32_sensor_units=" + esp32_sensor_units;
  Serial.println(data);
  sendPostRequest(data);
}

void sendPostRequest(String data) {
  HTTPClient http;
  
  if (http.begin(ipAddress, 3000, "/esp32/add_esp32_data")) { // Begin the HTTP POST request with the provided IP and port
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    
    int httpResponseCode = http.POST(data); // Send the POST request with the data
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String response = http.getString(); // Get the response from the server
      Serial.println(response);
    } else {
      Serial.print("Error sending POST request. HTTP error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end(); // Close the connection
  } else {
    Serial.println("Unable to connect to server");
  }
}

void sendPostRequestSensorEvent(String data) {
  HTTPClient http;
  
  if (http.begin(ipAddress.c_str(), 3000, "/esp32/add_esp32_event")) { // Begin the HTTP POST request with the provided IP and port
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    
    int httpResponseCode = http.POST(data); // Send the POST request with the data
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String response = http.getString(); // Get the response from the server
      Serial.println(response);
    } else {
      Serial.print("Error sending POST request. HTTP error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end(); // Close the connection
  } else {
    Serial.println("Unable to connect to server");
  }
}

void connectToWiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);
  int attempt = 0;
  while (WiFi.status() != 3) {
    delay(5000);
    Serial.print(WiFi.status());
    if(WiFi.status() == 3) {
      wifiTimeOfLastConnection = millis();
      break;
    }
    WiFi.begin(ssid, password);
    attempt++;
    if (attempt > 20) {
      Serial.println("\nFailed to connect to Wi-Fi. Restarting...");
      ESP.restart();
    }
  }
  Serial.println("Connected to Wi-Fi");
  Serial.println("IP Address: " + WiFi.localIP().toString());
}

void checkWiFiConnection() {
  if (WiFi.status() != 3) {
    Serial.println("WiFi connection lost. Attempting to reconnect...");
    connectToWiFi();
  }
}

void checkRestartESP32() {
  if ((millis() - lastRestartTime) >= restartInterval) {
    ESP.restart();
  }
}

String twoDigits(unsigned long number) {
  if (number < 10) {
    return "0" + String(number);
  } else {
    return String(number);
  }

}

String updateWiFiConnectedTimeString() {
  unsigned long connectedTime = millis() - wifiTimeOfLastConnection;
  unsigned long hours = (connectedTime / (1000 * 60 * 60)) % 24;
  unsigned long minutes = (connectedTime / (1000 * 60)) % 60;
  unsigned long seconds = (connectedTime / 1000) % 60;
  String wifiConnectedTimeString = twoDigits(hours) + ":" + twoDigits(minutes) + ":" + twoDigits(seconds);
  return wifiConnectedTimeString;
}

String updateUptimeString() {
  unsigned long uptime = millis() - lastPowerOnTime;
  unsigned long days = uptime / (1000 * 60 * 60 * 24);
  unsigned long hours = (uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60);
  unsigned long minutes = (uptime % (1000 * 60 * 60)) / (1000 * 60);
  unsigned long seconds = (uptime % (1000 * 60)) / 1000;
  String uptimeString = String(days) + "d " + twoDigits(hours) + ":" + twoDigits(minutes) + ":" + twoDigits(seconds);
  return uptimeString;
}


