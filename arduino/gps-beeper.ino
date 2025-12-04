#include <TinyGPS++.h>
#include <SoftwareSerial.h>

static const int TXPin = 7, RXPin = 6;
static const uint32_t GPSBaud = 9600;
static const unsigned long TIME_SYNC_INTERVAL = 86400000; // 24 hours in milliseconds

TinyGPSPlus gps;
int relayPin = 9;    // SSR control pin
int buzzerPin = 3;   // Buzzer Pin
int ppsPin = 5;      // PPS input pin
unsigned long lastTimeSync = 0; // Variable to track the last time the GPS time was synchronized

SoftwareSerial ss(RXPin, TXPin);

void setup() {
  Serial.begin(9600);
  ss.begin(GPSBaud);
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); // Initialize relay as off
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);
  pinMode(ppsPin, INPUT);

  Serial.println(F("DeviceExample.ino"));
  Serial.println(F("A simple demonstration of TinyGPS++ with an attached GPS module"));
  Serial.print(F("Testing TinyGPS++ library v. ")); Serial.println(TinyGPSPlus::libraryVersion());
  Serial.println(F("by Mikal Hart"));
  Serial.println();
}

void loop() {
  // Synchronize time with GPS once a day
  if (millis() - lastTimeSync > TIME_SYNC_INTERVAL) {
    syncTimeWithGPS();
  }

  // Get the current system time
  unsigned long currentMillis = millis();
  //Serial.println(currentMillis);

  // Check if the seconds are divisible by 10
  if (currentMillis / 1000 % 10 == 0) {
    // Enable the relay
    digitalWrite(relayPin, LOW);

    // Listen for the PPS pulse
    while (true) {
      if (digitalRead(ppsPin) == HIGH) {
        // Beep the buzzer for 150ms
        Serial.println("ppsPin == HIGH");
        digitalWrite(buzzerPin, HIGH);
        Serial.println(currentMillis);
        delay(100);
        digitalWrite(buzzerPin, LOW);
        digitalWrite(relayPin, HIGH);
        delay(1000);
        break;
      }

    }
  }
  //haveBeeped = 0;
}

void syncTimeWithGPS() {
  while (ss.available() > 0)
    if (gps.encode(ss.read()))
      displayInfo();

  lastTimeSync = millis();
}

void displayInfo() {
  // Display GPS information
}
