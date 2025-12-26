#include <TinyGPS++.h>
#include <SoftwareSerial.h>

static const int TXPin = 7, RXPin = 6;
static const uint32_t GPSBaud = 9600;

TinyGPSPlus gps;
SoftwareSerial ss(RXPin, TXPin);

const int relayPin  = 9;  // SSR
const int buzzerPin = 3;  // Piezo
const int ppsPin    = 5;  // GPS PPS input

volatile bool ppsFlag = false;

bool timeSynced  = false;   // do we know the current GPS time?
bool ppsAligned  = false;   // have we linked PPS to that time yet?

uint32_t secondsOfDay = 0;  // 0..86399
int lastGpsHour   = 0;
int lastGpsMinute = 0;
int lastGpsSecond = 0;

const int BEEP_INTERVAL = 10;  // seconds between beeps

void setup() {
  Serial.begin(9600);
  ss.begin(GPSBaud);

  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH);   // relay off

  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  pinMode(ppsPin, INPUT);         // or INPUT_PULLUP depending on your module
  attachInterrupt(digitalPinToInterrupt(ppsPin), onPPS, RISING);

  Serial.println(F("GPS-timed beeper starting..."));
}

void loop() {
  // Feed the GPS parser
  while (ss.available() > 0) {
    char c = ss.read();
    gps.encode(c);

    if (gps.time.isUpdated()) {
      // Store the latest GPS time-of-day
      lastGpsHour   = gps.time.hour();
      lastGpsMinute = gps.time.minute();
      lastGpsSecond = gps.time.second();
      timeSynced    = true;
    }
  }

  // Handle PPS "ticks" in the main loop
  if (ppsFlag) {
    ppsFlag = false;

    if (timeSynced && !ppsAligned) {
      // First time we see PPS after valid GPS time:
      // anchor secondsOfDay to that GPS time.
      secondsOfDay = lastGpsHour * 3600UL
                   + lastGpsMinute * 60UL
                   + lastGpsSecond;
      ppsAligned = true;
      Serial.print(F("PPS aligned: "));
      Serial.print(lastGpsHour);
      Serial.print(':');
      Serial.print(lastGpsMinute);
      Serial.print(':');
      Serial.println(lastGpsSecond);
    } else if (ppsAligned) {
      // Every subsequent PPS: advance one second
      secondsOfDay = (secondsOfDay + 1) % 86400UL;
    }

    if (ppsAligned) {
      // Beep every 10 seconds: at ..:..:00, :10, :20, :30, :40, :50
      if ((secondsOfDay % BEEP_INTERVAL) == 0) {
        doBeep();
      }
    }
  }

  // ... you can do other stuff here if needed ...
}

void onPPS() {
  ppsFlag = true;
}

void doBeep() {
  Serial.print(F("Beep at secondsOfDay="));
  Serial.println(secondsOfDay);

  digitalWrite(relayPin, LOW);    // allow buzzer signal
  digitalWrite(buzzerPin, HIGH);
  delay(100);                     // beep length
  digitalWrite(buzzerPin, LOW);
  digitalWrite(relayPin, HIGH);   // mute buzzer again
}
