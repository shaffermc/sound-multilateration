#include <Wire.h>
#include <Adafruit_BMP085.h>
#include <HTTPClient.h>
#include <WiFi.h>

Adafruit_BMP085 bmp; // Initialize BMP180 sensor on D23 (SDA) and D22 (SCL)

const char* ssid = "x";
const char* password = "x";

unsigned long uptime = 0;
unsigned long lastPowerOnTime = 0;
unsigned long wifiUptime = 0;
unsigned long wifiTimeOfLastConnection = 0;
 
unsigned long lastRestartTime = 0;
const unsigned long restartInterval = 86400000; // Restart every day

String ipAddress = "209.46.124.94"; // Variable to store the IP address

void setup() {
  Serial.begin(9600);
  Serial.println("BMP180 Sensor");
  lastPowerOnTime = millis();
  Wire.begin(22, 23); // Initialize I2C communication with D23 as SDA and D22 as SCL
  bmp.begin();

  // Connect to Wi-Fi
  connectToWiFi();

}

void loop() {
  
  checkWiFiConnection();
  
  String wifiUptimeToSend = updateWiFiConnectedTimeString();
  String esp32UptimeToSend = updateUptimeString();
  sendSensorEventData("ESP32-06", "Wifi Uptime", wifiUptimeToSend, "Time");
  sendSensorEventData("ESP32-06", "System Uptime", esp32UptimeToSend, "Time");

  // Read temperature from BMP180
  float BMP180_temp_C = bmp.readTemperature(); // Temperature in Celsius

  if (BMP180_temp_C != 0xFFFF) { // Check if the reading is valid
    float BMP180_temp_F = (BMP180_temp_C * 9 / 5) + 32; // Convert to Fahrenheit
    Serial.print("BMP180 - Temperature: ");
    Serial.print(BMP180_temp_F);
    Serial.println(" °F");
    Serial.println();
    Serial.println("Sending BMP180 temperature data...");
    sendData("ESP32-06", "BMP180", "Temperature", String(BMP180_temp_F, 2), "Fahrenheit");
  } else {
    Serial.println("Failed to read temperature from BMP180 sensor. Please check wiring.");
  }

  // Read pressure from BMP180
  float BMP180_pressure = bmp.readPressure(); // Pressure in Pa

  if (BMP180_pressure != 0) { // Check if the reading is valid
    Serial.print("Pressure: ");
    Serial.print(BMP180_pressure / 100.0); // Convert Pa to hPa
    Serial.println(" hPa");
    Serial.println();
    Serial.println("Sending BMP180 pressure data...");
    sendData("ESP32-06", "BMP180", "Barometric Pressure", String(BMP180_pressure / 100.0, 2), "hPa");
  } else {
    Serial.println("Failed to read pressure from BMP180 sensor. Please check wiring.");
  }

  int count = 60;
  while (count > 0) {
    Serial.println(count);
    count = count - 1;
    delay(1000);
  }
}

void sendSensorEventData(String sensor_location, String sensor_event_type, String sensor_event_value, String sensor_event_units) {
  String data = "&esp32_sensor_location=" + sensor_location + "&esp32_sensor_event_type=" + sensor_event_type + "&esp32_sensor_event_value=" + sensor_event_value +"&esp32_sensor_event_units=" + sensor_event_units;
  Serial.println(data);
  sendPostRequestSensorEvent(data);
}

void sendData(String sensor_location, String sensor_name, String sensor_type, String sensor_reading, String sensor_units) {
  String data = "&esp32_location=" + sensor_location + "&esp32_name=" + sensor_name + "&esp32_sensor_type=" + esp32_sensor_type + "&esp32_sensor_reading=" + esp32_sensor_reading + "&esp32_sensor_units=" + esp32_sensor_units;
  Serial.println(data);
  sendPostRequest(data);
}

void sendPostRequest(String data) {
  HTTPClient http;
  
  if (http.begin(ipAddress, 3000, "/esp32/update_sensor_data")) { // Begin the HTTP POST request with the provided IP and port
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
  
  if (http.begin(ipAddress.c_str(), 3000, "/add_sensor_event")) { // Begin the HTTP POST request with the provided IP and port
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

void loadIPAddressFromWebpage(String url) {
  HTTPClient http;

  http.begin(url); // Begin the HTTP request with the provided URL

  int httpResponseCode = http.GET(); // Make the HTTP GET request

  if (httpResponseCode == HTTP_CODE_OK) {
    String payload = http.getString();
    ipAddress = payload;
    Serial.print("IP Address obtained from webpage: ");
    Serial.println(ipAddress);
  } else {
    Serial.print("Error loading IP address from webpage. HTTP error code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
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


