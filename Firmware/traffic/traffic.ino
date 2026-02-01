/*
 * Smart Ambulance System - Traffic Signal Unit
 * 
 * Hardware Components:
 * - Arduino Nano R3 (CH340)
 * - NRF24L01 RF Transceiver (SPI)
 * - WS2812 RGB LED Strip (4 LEDs for 4-way traffic signal)
 * 
 * Features:
 * - Normal traffic light operation (cycling through directions)
 * - Emergency mode when ambulance detected
 * - Prioritize ambulance direction (green), set others to red
 * - Return to normal operation after ambulance passes
 * 
 * LED Configuration (3 LEDs per direction - Red, Yellow, Green):
 * - LEDs 0-2:   North (Red=0, Yellow=1, Green=2)
 * - LEDs 3-5:   East  (Red=3, Yellow=4, Green=5)
 * - LEDs 6-8:   South (Red=6, Yellow=7, Green=8)
 * - LEDs 9-11:  West  (Red=9, Yellow=10, Green=11)
 */

#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <Adafruit_NeoPixel.h>

// NRF24L01 Pins (CE=9, CSN=10, MOSI=11, MISO=12, SCK=13)
#define CE_PIN 9
#define CSN_PIN 10
RF24 radio(CE_PIN, CSN_PIN);
const byte address[6] = "00001";

// WS2812 LED Strip
#define LED_PIN 6
#define NUM_LEDS 12  // 3 LEDs per direction (Red, Yellow, Green) x 4 directions
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// Traffic light colors
#define RED strip.Color(255, 0, 0)
#define YELLOW strip.Color(255, 150, 0)
#define GREEN strip.Color(0, 255, 0)
#define OFF strip.Color(0, 0, 0)

// LED indices for each direction (Red, Yellow, Green)
#define NORTH_RED 0
#define NORTH_YELLOW 1
#define NORTH_GREEN 2
#define EAST_RED 3
#define EAST_YELLOW 4
#define EAST_GREEN 5
#define SOUTH_RED 6
#define SOUTH_YELLOW 7
#define SOUTH_GREEN 8
#define WEST_RED 9
#define WEST_YELLOW 10
#define WEST_GREEN 11

// Traffic directions
enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3
};

// Traffic state
enum TrafficState {
  NORMAL_MODE,
  EMERGENCY_MODE
};

TrafficState currentState = NORMAL_MODE;
Direction currentGreen = NORTH;
Direction ambulanceDirection = NORTH;

unsigned long lastChangeTime = 0;
unsigned long emergencyStartTime = 0;
const unsigned long NORMAL_GREEN_TIME = 15000; // 15 seconds per direction
const unsigned long YELLOW_TIME = 3000; // 3 seconds yellow
const unsigned long EMERGENCY_DURATION = 30000; // 30 seconds emergency mode
const unsigned long EMERGENCY_CHECK_INTERVAL = 10000; // Check for new ambulance data every 10 sec

bool yellowPhase = false;
String lastHospitalReceived = "";

void setup() {
  Serial.begin(9600);
  Serial.println("Smart Traffic Signal - Starting");
  
  // Initialize LED Strip
  strip.begin();
  strip.setBrightness(255);
  strip.show(); // Initialize all LEDs to OFF
  
  // Initialize NRF24L01
  if (!radio.begin()) {
    Serial.println("NRF24L01 initialization failed!");
    // Blink all LEDs red to indicate error
    for(int i = 0; i < 5; i++) {
      setAllLEDs(RED);
      delay(200);
      setAllLEDs(OFF);
      delay(200);
    }
  }
  
  radio.openReadingPipe(0, address);
  radio.setPALevel(RF24_PA_MAX);
  radio.startListening();
  
  Serial.println("Traffic Signal Ready");
  Serial.println("Waiting for ambulance signal...");
  
  // Start with normal traffic operation
  startNormalMode();
}

void loop() {
  // Check for ambulance transmission
  if (radio.available()) {
    char receivedData[32] = "";
    radio.read(&receivedData, sizeof(receivedData));
    
    String message = String(receivedData);
    Serial.println("Received: " + message);
    
    // Parse message format: "AMB-MUM-1024|Hospital 1|EMERGENCY|54"
    if (message.indexOf("EMERGENCY") >= 0) {
      processEmergencySignal(message);
    }
  }
  
  // Handle traffic light logic based on current state
  if (currentState == NORMAL_MODE) {
    handleNormalMode();
  } else if (currentState == EMERGENCY_MODE) {
    handleEmergencyMode();
  }
  
  delay(100);
}

void processEmergencySignal(String message) {
  // Extract hospital destination to determine direction
  int hospitalStart = message.indexOf('|') + 1;
  int hospitalEnd = message.indexOf('|', hospitalStart);
  String hospital = message.substring(hospitalStart, hospitalEnd);
  
  // Map hospital to direction (customize based on your setup)
  // Example: Hospital 1 = North, Hospital 2 = East, etc.
  if (hospital.indexOf("Hospital 1") >= 0) {
    ambulanceDirection = NORTH;
  } else if (hospital.indexOf("Hospital 2") >= 0) {
    ambulanceDirection = EAST;
  } else if (hospital.indexOf("Hospital 3") >= 0) {
    ambulanceDirection = SOUTH;
  } else if (hospital.indexOf("Hospital 4") >= 0) {
    ambulanceDirection = WEST;
  }
  
  // Switch to emergency mode
  if (currentState != EMERGENCY_MODE || hospital != lastHospitalReceived) {
    Serial.println("EMERGENCY MODE ACTIVATED - Direction: " + String(ambulanceDirection));
    lastHospitalReceived = hospital;
    enterEmergencyMode();
  }
  
  // Reset emergency timer
  emergencyStartTime = millis();
}

void enterEmergencyMode() {
  currentState = EMERGENCY_MODE;
  emergencyStartTime = millis();
  
  // Set ambulance direction to GREEN, all others to RED
  // Turn off all LEDs first
  setAllLEDs(OFF);
  
  // Light up appropriate LEDs for each direction
  for (int dir = 0; dir < 4; dir++) {
    if (dir == ambulanceDirection) {
      // Green light for ambulance direction
      strip.setPixelColor(dir * 3 + 2, GREEN);  // Green LED
    } else {
      // Red light for other directions
      strip.setPixelColor(dir * 3, RED);  // Red LED
    }
  }
  strip.show();
  
  Serial.println("Emergency lights activated");
}

void handleEmergencyMode() {
  // Check if emergency duration has expired
  if (millis() - emergencyStartTime >= EMERGENCY_DURATION) {
    Serial.println("Emergency mode timeout - Returning to normal");
    exitEmergencyMode();
  }
  
  // Keep emergency lights active
  // Optionally add blinking for ambulance direction
}

void exitEmergencyMode() {
  currentState = NORMAL_MODE;
  lastHospitalReceived = "";
  startNormalMode();
}

void startNormalMode() {
  currentGreen = NORTH;
  lastChangeTime = millis();
  yellowPhase = false;
  setTrafficLights(currentGreen, false);
  Serial.println("Normal traffic mode started");
}

void handleNormalMode() {
  unsigned long currentTime = millis();
  
  if (!yellowPhase) {
    // Green phase
    if (currentTime - lastChangeTime >= NORMAL_GREEN_TIME) {
      // Switch to yellow
      yellowPhase = true;
      setTrafficLights(currentGreen, true);
      lastChangeTime = currentTime;
    }
  } else {
    // Yellow phase
    if (currentTime - lastChangeTime >= YELLOW_TIME) {
      // Switch to next direction
      yellowPhase = false;
      currentGreen = (Direction)((currentGreen + 1) % 4);  // Only 4 directions
      setTrafficLights(currentGreen, false);
      lastChangeTime = currentTime;
      Serial.println("Changed to direction: " + String(currentGreen));
    }
  }
}

void setTrafficLights(Direction greenDir, bool isYellow) {
  // Turn off all LEDs first
  setAllLEDs(OFF);
  
  // Light up appropriate LEDs for each direction
  for (int dir = 0; dir < 4; dir++) {
    int ledBase = dir * 3;  // Starting LED index for this direction
    
    if (dir == greenDir) {
      if (isYellow) {
        // Yellow light for current direction
        strip.setPixelColor(ledBase + 1, YELLOW);  // Yellow LED
      } else {
        // Green light for current direction
        strip.setPixelColor(ledBase + 2, GREEN);   // Green LED
      }
    } else {
      // Red light for other directions
      strip.setPixelColor(ledBase, RED);  // Red LED
    }
  }
  strip.show();
}

void setAllLEDs(uint32_t color) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, color);
  }
  strip.show();
}
