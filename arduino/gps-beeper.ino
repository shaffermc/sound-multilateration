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

const unsigned long BEEP_INTERVAL = 60;
const unsigned long BEEP_DURATION = 100;

// =====================================================
// PPS VARIABLES
// =====================================================

volatile unsigned long ppsCount = 0;
volatile unsigned long ppsMicros = 0;

unsigned long processedPps = 0;
unsigned long lastPpsMillis = 0;

// =====================================================
// CLOCK VARIABLES
// =====================================================

bool clockSynced = false;

unsigned long secondsOfDay = 0;

int utcYear  = 0;
int utcMonth = 0;
int utcDay   = 0;

// Last valid GPS timestamp
unsigned long gpsSeconds = 0;
unsigned long gpsTimestampPPS = 0;

bool gpsTimestampReady = false;

// Number of PPS pulses associated with clock time
unsigned long clockPPS = 0;

// =====================================================
// BUZZER VARIABLES
// =====================================================

bool buzzerActive = false;
unsigned long buzzerStart = 0;

// =====================================================
// DIAGNOSTICS
// =====================================================

unsigned long lastDebug = 0;

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
  Serial.println(F("GT-U7 GPS EASTERN CLOCK"));
  Serial.println(F("Arduino Nano"));
  Serial.println(F("============================"));
  Serial.println(F("Waiting for GPS synchronization..."));
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  // Handle PPS immediately
  processPPS();

  // Read GPS serial data
  readGPS();

  // Synchronize using completed GPS timestamps
  synchronizeClock();

  // Handle buzzer timing
  updateBuzzer();

  // Detect PPS loss
  checkPPS();

  // Diagnostics
  printDiagnostics();
}

// =====================================================
// PPS INTERRUPT
// =====================================================

void onPPS() {

  ppsCount++;
  ppsMicros = micros();
}

// =====================================================
// READ GPS
// =====================================================

void readGPS() {

  while (gpsSerial.available()) {

    char c = gpsSerial.read();

    if (gps.encode(c)) {

      // Only use freshly updated time and date.
      // Require a valid, recent GPS fix.

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

  if (!gpsTimestampReady) {
    return;
  }

  if (gpsTimestampPPS == 0) {
    return;
  }

  // The GT-U7 normally sends its NMEA data after
  // the PPS pulse associated with that second.
  //
  // Associate the GPS timestamp with that pulse.

  secondsOfDay = gpsSeconds;

  clockPPS = gpsTimestampPPS;

  clockSynced = true;

  gpsTimestampReady = false;

  lastPpsMillis = millis();

  Serial.println();
  Serial.println(F("*** GPS PPS SYNCHRONIZED ***"));

  printEasternTime();

  // Don't beep during initial synchronization.
  // Wait for the next PPS minute boundary.
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

  // Advance the clock by the number of PPS pulses
  // since the last clock update.

  unsigned long elapsed =
    currentPPS - clockPPS;

  if (elapsed == 0) {
    return;
  }

  clockPPS = currentPPS;

  // Advance UTC date when crossing midnight.
  for (unsigned long i = 0; i < elapsed; i++) {

    secondsOfDay++;

    if (secondsOfDay >= 86400UL) {

      secondsOfDay = 0;
      advanceUTCDate();
    }
  }

  // Beep at the beginning of each minute.
  // Require a recent valid GPS fix.

  if (gps.location.isValid() &&
      gps.location.age() < 3000) {

    if ((secondsOfDay % BEEP_INTERVAL) == 0) {

      startBeep();
    }
  }

  // Print Eastern Time
  printEasternTime();
}

// =====================================================
// START BUZZER
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

// =====================================================
// UPDATE BUZZER
// =====================================================

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
// CHECK PPS SIGNAL
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
// LEAP YEAR
// =====================================================

bool isLeapYear(int year) {

  return (
    (year % 4 == 0 &&
     year % 100 != 0) ||
    (year % 400 == 0)
  );
}

// =====================================================
// DAYS IN MONTH
// =====================================================

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

// =====================================================
// ADVANCE UTC DATE
// =====================================================

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

  // January, February, December = EST
  if (month < 3 || month > 11) {
    return false;
  }

  // April through October = EDT
  if (month > 3 && month < 11) {
    return true;
  }

  // March: second Sunday, 07:00 UTC
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

  // November: first Sunday, 06:00 UTC
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
// PRINT TWO DIGITS
// =====================================================

void printTwoDigits(int value) {

  if (value < 10) {
    Serial.print('0');
  }

  Serial.print(value);
}

// =====================================================
// PRINT EASTERN TIME
// =====================================================

void printEasternTime() {

  int utcHour =
    secondsOfDay / 3600UL;

  bool dst = isEasternDST(
    utcYear,
    utcMonth,
    utcDay,
    utcHour
  );

  int offset = dst ? -4 : -5;

  long easternSeconds =
    (long)secondsOfDay +
    offset * 3600L;

  if (easternSeconds < 0) {
    easternSeconds += 86400L;
  }

  easternSeconds %= 86400L;

  int hour =
    easternSeconds / 3600;

  int minute =
    (easternSeconds % 3600) / 60;

  int second =
    easternSeconds % 60;

  Serial.print(F("Eastern Time: "));

  printTwoDigits(hour);
  Serial.print(':');

  printTwoDigits(minute);
  Serial.print(':');

  printTwoDigits(second);

  if (dst) {
    Serial.println(F(" EDT"));
  }
  else {
    Serial.println(F(" EST"));
  }
}

// =====================================================
// PRINT DIAGNOSTICS
// =====================================================

void printDiagnostics() {

  if (millis() - lastDebug < 10000) {
    return;
  }

  lastDebug = millis();

  unsigned long count;

  noInterrupts();
  count = ppsCount;
  interrupts();

  Serial.println();
  Serial.println(F("----------------------------"));

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

  Serial.print(F("GPS Time: "));
  Serial.println(
    gps.time.isValid()
      ? F("VALID") : F("INVALID")
  );

  Serial.print(F("PPS Count: "));
  Serial.println(count);

  Serial.print(F("Clock Synced: "));
  Serial.println(
    clockSynced ? F("YES") : F("NO")
  );

  Serial.println(F("----------------------------"));
}