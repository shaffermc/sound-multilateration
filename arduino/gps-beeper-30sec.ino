#include <TinyGPS++.h>
#include <SoftwareSerial.h>

static const int TXPin = 7, RXPin = 6;
static const uint32_t GPSBaud = 9600;

TinyGPSPlus gps;
SoftwareSerial ss(RXPin, TXPin);

const int relayPin  = 9;  // SSR control pin
const int buzzerPin = 3;  // Piezo buzzer pin
const int ppsPin    = 5;  // GPS PPS input pin

volatile bool ppsFlag = false;

bool timeSynced  = false;   // we have valid GPS time
bool ppsAligned  = false;   // PPS is aligned to that time

uint32_t secondsOfDay = 0;  // 0..86399
int lastGpsHour   = 0;
int lastGpsMinute = 0;
int lastGpsSecond = 0;

const int BEEP_INTERVAL = 30;   // <<<----- beep every 30 seconds

void setup() {
  Serial.begin(9600);
  ss.begin(GPSBaud);

  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH);   // relay OFF

  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  pinMode(ppsPin, INPUT);         // use INPUT_PULLUP if your PPS is open drain
  attachInterrupt(digitalPinToInterrupt(ppsPin), onPPS, RISING);

  Serial.println(F("GPS-timed 30-second beeper starting..."));
}

void loop() {
  // Feed TinyGPS++
  while (ss.available() > 0) {
    char c = ss.read();
    gps.decode(c);

    if (gps.time.isUpdated()) {
      lastGpsHour   = gps.time.hour();
      lastGpsMinute = gps.time.minute();
      lastGpsSecond = gps.time.second();
      timeSynced    = true;
    }
  }

  // Handle PPS ticks in the main loop
  if (ppsFlag) {
    ppsFlag = false;

    if (timeSynced && !ppsAligned) {
      // First PPS after valid GPS time — anchor to GPS time
      secondsOfDay = lastGpsHour * 3600UL
                   + lastGpsMinute * 60UL
                   + lastGpsSecond;
      ppsAligned = true;

      Serial.print(F("PPS aligned at "));
      Serial.print(lastGpsHour);
      Serial.print(':');
      Serial.print(lastGpsMinute);
      Serial.print(':');
      Serial.println(lastGpsSecond);
    }
    else if (ppsAligned) {
      // Every PPS after that — advance by 1 second
      secondsOfDay = (secondsOfDay + 1) % 86400UL;
    }

    if (ppsAligned) {
      // Beep at …:00 and …:30 each minute
      if ((secondsOfDay % BEEP_INTERVAL) == 0) {
        doBeep();
      }
    }
  }
}

void onPPS() {
  ppsFlag = true;
}

void doBeep() {
  Serial.print(F("Beep at secondsOfDay="));
  Serial.println(secondsOfDay);

  digitalWrite(relayPin, LOW);    // enable buzzer path (if SSR mutes it)
  digitalWrite(buzzerPin, HIGH);
  delay(100);                     // beep length
  digitalWrite(buzzerPin, LOW);
  digitalWrite(relayPin, HIGH);   // mute buzzer again
}
