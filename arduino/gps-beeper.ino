#include <TinyGPS++.h>
#include <SoftwareSerial.h>

// =====================================================
// GPS CONFIGURATION
// =====================================================

const byte RXPin = 6;
const byte TXPin = 7;
const unsigned long GPSBaud = 9600;

TinyGPSPlus gps;
SoftwareSerial gpsSerial(RXPin, TXPin);

// =====================================================
// HARDWARE PINS
// =====================================================

const byte relayPin  = 9;
const byte buzzerPin = 3;
const byte ppsPin    = 2;

// =====================================================
// SETTINGS
// =====================================================

// Keep buzzer disabled until timing is verified
const bool ENABLE_BUZZER = true;

const unsigned long BEEP_INTERVAL = 60;
const unsigned long BEEP_DURATION = 100;

// =====================================================
// PPS VARIABLES
// =====================================================

volatile unsigned long ppsCount = 0;
volatile unsigned long lastPpsMicros = 0;

// Reject extra interrupts occurring within 500 ms
// of the previous PPS pulse.
volatile unsigned long rejectedPulses = 0;

unsigned long processedPps = 0;
unsigned long clockPPS = 0;

unsigned long lastPpsMillis = 0;

// =====================================================
// CLOCK VARIABLES
// =====================================================

bool clockSynced = false;

unsigned long secondsOfDay = 0;

int utcYear  = 0;
int utcMonth = 0;
int utcDay   = 0;

unsigned long gpsSeconds = 0;
unsigned long gpsTimestampPPS = 0;

bool gpsTimestampReady = false;

// =====================================================
// BUZZER VARIABLES
// =====================================================

bool buzzerActive = false;
unsigned long buzzerStart = 0;

// =====================================================
// DIAGNOSTICS
// =====================================================

unsigned long lastDebug = 0;
unsigned long lastDebugPPS = 0;
unsigned long lastDebugMillis = 0;

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(9600);
  gpsSerial.begin(GPSBaud);

  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH);

  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  pinMode(ppsPin, INPUT);

  attachInterrupt(
    digitalPinToInterrupt(ppsPin),
    onPPS,
    RISING
  );

  Serial.println();
  Serial.println(F("============================"));
  Serial.println(F("GT-U7 GPS TIME DIAGNOSTIC"));
  Serial.println(F("Arduino Nano"));
  Serial.println(F("============================"));
  Serial.println(F("Buzzer temporarily disabled"));
  Serial.println(F("Waiting for GPS synchronization..."));

  lastDebugMillis = millis();
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  processPPS();

  readGPS();

  synchronizeClock();

  updateBuzzer();

  checkPPS();

  printDiagnostics();
}

// =====================================================
// PPS INTERRUPT
// =====================================================

void onPPS() {

  unsigned long now = micros();

  // Reject pulses less than 500 ms apart.
  // The first pulse is accepted.

  if (ppsCount == 0 ||
      (unsigned long)(now - lastPpsMicros) >= 500000UL) {

    ppsCount++;
    lastPpsMicros = now;

  } else {

    rejectedPulses++;
  }
}

// =====================================================
// READ GPS
// =====================================================

void readGPS() {

  while (gpsSerial.available()) {

    char c = gpsSerial.read();

    if (gps.encode(c)) {

      if (gps.time.isUpdated() &&
          gps.time.isValid() &&
          gps.date.isValid() &&
          gps.location.isValid() &&
          gps.location.age() < 3000) {

        gpsSeconds =
          gps.time.hour() * 3600UL +
          gps.time.minute() * 60UL +
          gps.time.second();

        utcYear  = gps.date.year();
        utcMonth = gps.date.month();
        utcDay   = gps.date.day();

        noInterrupts();
        gpsTimestampPPS = ppsCount;
        interrupts();

        gpsTimestampReady = true;
      }
    }
  }
}

// =====================================================
// INITIAL CLOCK SYNCHRONIZATION
// =====================================================

void synchronizeClock() {

  if (clockSynced) {
    return;
  }

  if (!gpsTimestampReady ||
      gpsTimestampPPS == 0) {
    return;
  }

  secondsOfDay = gpsSeconds;
  clockPPS = gpsTimestampPPS;

  clockSynced = true;
  gpsTimestampReady = false;

  lastPpsMillis = millis();

  Serial.println();
  Serial.println(F("*** INITIAL GPS SYNC ***"));

  printEasternTime();
}

// =====================================================
// PROCESS PPS
// =====================================================

void processPPS() {

  unsigned long currentPPS;

  noInterrupts();
  currentPPS = ppsCount;
  interrupts();

  if (currentPPS == processedPps) {
    return;
  }

  processedPps = currentPPS;
  lastPpsMillis = millis();

  if (!clockSynced) {
    return;
  }

  unsigned long elapsed =
    currentPPS - clockPPS;

  if (elapsed == 0) {
    return;
  }

  clockPPS = currentPPS;

  for (unsigned long i = 0; i < elapsed; i++) {

    secondsOfDay++;

    if (secondsOfDay >= 86400UL) {
      secondsOfDay = 0;
      advanceUTCDate();
    }
  }

  if (ENABLE_BUZZER &&
      gps.location.isValid() &&
      gps.location.age() < 3000) {

    if ((secondsOfDay % BEEP_INTERVAL) == 0) {
      startBeep();
    }
  }

  printEasternTime();
}

// =====================================================
// BUZZER
// =====================================================

void startBeep() {

  if (buzzerActive) {
    return;
  }

  digitalWrite(relayPin, LOW);
  digitalWrite(buzzerPin, HIGH);

  buzzerStart = millis();
  buzzerActive = true;

  Serial.println(F("*** BEEP ***"));
}

void updateBuzzer() {

  if (!buzzerActive) {
    return;
  }

  if (millis() - buzzerStart >= BEEP_DURATION) {

    digitalWrite(buzzerPin, LOW);
    digitalWrite(relayPin, HIGH);

    buzzerActive = false;
  }
}

// =====================================================
// PPS TIMEOUT
// =====================================================

void checkPPS() {

  if (!clockSynced) {
    return;
  }

  if (millis() - lastPpsMillis > 2500) {

    clockSynced = false;
    gpsTimestampReady = false;

    digitalWrite(buzzerPin, LOW);
    digitalWrite(relayPin, HIGH);
    buzzerActive = false;

    Serial.println();
    Serial.println(F("WARNING: PPS SIGNAL LOST"));
    Serial.println(F("Waiting for resynchronization..."));
  }
}

// =====================================================
// LEAP YEAR / DATE FUNCTIONS
// =====================================================

bool isLeapYear(int year) {

  return (
    (year % 4 == 0 && year % 100 != 0) ||
    (year % 400 == 0)
  );
}

int daysInMonth(int year, int month) {

  const byte days[] = {
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
  };

  if (month == 2 && isLeapYear(year)) {
    return 29;
  }

  return days[month - 1];
}

void advanceUTCDate() {

  utcDay++;

  if (utcDay > daysInMonth(utcYear, utcMonth)) {

    utcDay = 1;
    utcMonth++;

    if (utcMonth > 12) {

      utcMonth = 1;
      utcYear++;
    }
  }
}

// =====================================================
// DAY OF WEEK
// =====================================================

int dayOfWeek(int year, int month, int day) {

  static const int offsets[] = {
    0, 3, 2, 5, 0, 3,
    5, 1, 4, 6, 2, 4
  };

  if (month < 3) {
    year--;
  }

  return (
    year +
    year / 4 -
    year / 100 +
    year / 400 +
    offsets[month - 1] +
    day
  ) % 7;
}

// =====================================================
// EASTERN DAYLIGHT SAVING TIME
// =====================================================

bool isEasternDST(
  int year,
  int month,
  int day,
  int hour
) {

  if (month < 3 || month > 11) {
    return false;
  }

  if (month > 3 && month < 11) {
    return true;
  }

  if (month == 3) {

    int firstSunday =
      1 + (7 - dayOfWeek(year, 3, 1)) % 7;

    int secondSunday = firstSunday + 7;

    if (day > secondSunday) {
      return true;
    }

    if (day < secondSunday) {
      return false;
    }

    return hour >= 7;
  }

  if (month == 11) {

    int firstSunday =
      1 + (7 - dayOfWeek(year, 11, 1)) % 7;

    if (day < firstSunday) {
      return true;
    }

    if (day > firstSunday) {
      return false;
    }

    return hour < 6;
  }

  return false;
}

// =====================================================
// PRINT HELPERS
// =====================================================

void printTwoDigits(int value) {

  if (value < 10) {
    Serial.print('0');
  }

  Serial.print(value);
}

void printHMS(unsigned long totalSeconds) {

  totalSeconds %= 86400UL;

  printTwoDigits(totalSeconds / 3600UL);
  Serial.print(':');

  printTwoDigits((totalSeconds % 3600UL) / 60UL);
  Serial.print(':');

  printTwoDigits(totalSeconds % 60UL);
}

// =====================================================
// PRINT EASTERN TIME
// =====================================================

void printEasternTime() {

  int utcHour = secondsOfDay / 3600UL;

  bool dst = isEasternDST(
    utcYear,
    utcMonth,
    utcDay,
    utcHour
  );

  int offset = dst ? -4 : -5;

  long easternSeconds =
    (long)secondsOfDay + offset * 3600L;

  if (easternSeconds < 0) {
    easternSeconds += 86400L;
  }

  easternSeconds %= 86400L;

  Serial.print(F("Eastern Time: "));

  printHMS(easternSeconds);

  Serial.println(dst ? F(" EDT") : F(" EST"));
}

// =====================================================
// PRINT DIAGNOSTICS
// =====================================================

void printDiagnostics() {

  if (millis() - lastDebug < 10000UL) {
    return;
  }

  unsigned long nowMillis = millis();

  unsigned long count;
  unsigned long rejected;

  noInterrupts();
  count = ppsCount;
  rejected = rejectedPulses;
  interrupts();

  unsigned long intervalMillis =
    nowMillis - lastDebugMillis;

  unsigned long intervalPPS =
    count - lastDebugPPS;

  lastDebug = nowMillis;
  lastDebugMillis = nowMillis;
  lastDebugPPS = count;

  Serial.println();
  Serial.println(F("============================"));
  Serial.println(F("GPS TIMING DIAGNOSTICS"));
  Serial.println(F("============================"));

  Serial.print(F("GPS Characters: "));
  Serial.println(gps.charsProcessed());

  Serial.print(F("GPS Sentences: "));
  Serial.println(gps.passedChecksum());

  Serial.print(F("GPS Fix: "));
  Serial.println(
    (gps.location.isValid() &&
     gps.location.age() < 3000)
      ? F("VALID") : F("NO FIX")
  );

  Serial.print(F("GPS UTC: "));

  if (gps.time.isValid()) {

    printTwoDigits(gps.time.hour());
    Serial.print(':');

    printTwoDigits(gps.time.minute());
    Serial.print(':');

    printTwoDigits(gps.time.second());
    Serial.println();

  } else {

    Serial.println(F("INVALID"));
  }

  Serial.print(F("Internal UTC: "));

  if (clockSynced) {
    printHMS(secondsOfDay);
    Serial.println();
  } else {
    Serial.println(F("NOT SYNCED"));
  }

  Serial.print(F("PPS Count: "));
  Serial.println(count);

  Serial.print(F("PPS in interval: "));
  Serial.println(intervalPPS);

  Serial.print(F("Interval milliseconds: "));
  Serial.println(intervalMillis);

  Serial.print(F("Rejected PPS edges: "));
  Serial.println(rejected);

  Serial.print(F("Clock Synced: "));
  Serial.println(clockSynced ? F("YES") : F("NO"));

  // Compare internal clock with latest GPS time.
  // This is approximate because NMEA and PPS are
  // not sampled at exactly the same instant.

  if (clockSynced && gps.time.isValid()) {

    long difference =
      (long)secondsOfDay -
      (long)(
        gps.time.hour() * 3600UL +
        gps.time.minute() * 60UL +
        gps.time.second()
      );

    if (difference > 43200L) {
      difference -= 86400L;
    }

    if (difference < -43200L) {
      difference += 86400L;
    }

    Serial.print(F("Internal - GPS seconds: "));
    Serial.println(difference);
  }

  Serial.println(F("============================"));
}