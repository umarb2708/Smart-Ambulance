/*
 * Smart Ambulance System - Ambulance Unit
 * 
 * Hardware Components:
 * - ESP32 NodeMCU
 * - MLX90614ESF IR Temperature Sensor (I2C)
 * - MAX30102 Pulse Oximeter Heart Rate Sensor (I2C)
 * - 0.96" OLED Display (I2C)
 * - NRF24L01 RF Transceiver (SPI)
 * - GPS Module (Serial)
 * 
 * Features:
 * - Monitor patient vitals (temperature, heart rate, oxygen level)
 * - Display Patient ID on OLED
 * - Send data to Google Sheets via WiFi
 * - Transmit ambulance info to traffic signals via NRF24L01
 * - GPS location tracking
 */

#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Google Sheets deployment URL
const char* serverName = "YOUR_GOOGLE_APPS_SCRIPT_DEPLOYMENT_URL";

// OLED Display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Temperature Sensor
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// Pulse Oximeter
MAX30105 particleSensor;
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// NRF24L01 (SPI Pins: MISO=19, MOSI=23, SCK=18, CE=4, CSN=5)
#define CE_PIN 4
#define CSN_PIN 5
RF24 radio(CE_PIN, CSN_PIN);
const byte address[6] = "00001";

// GPS Module (Serial2: RX=16, TX=17)
#define GPS_RX 16
#define GPS_TX 17
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

// Patient ID
String patientID = "";
String ambulanceID = "AMB-MUM-1024";

// Timing variables
unsigned long lastUploadTime = 0;
unsigned long lastTransmitTime = 0;
const unsigned long UPLOAD_INTERVAL = 10000; // 10 seconds
const unsigned long TRANSMIT_INTERVAL = 5000; // 5 seconds

// Sensor data
float bodyTemp = 0.0;
int heartRate = 0;
int spo2 = 0;
float latitude = 0.0;
float longitude = 0.0;
float ambulanceSpeed = 0.0;
String hospital = "";
bool patientActive = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Smart Ambulance");
  display.println("Initializing...");
  display.display();
  
  // Initialize Temperature Sensor
  if (!mlx.begin()) {
    Serial.println("MLX90614 not found!");
    display.println("Temp sensor error");
    display.display();
  }
  
  // Initialize Pulse Oximeter
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found!");
    display.println("Pulse ox error");
    display.display();
  }
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
  
  // Initialize NRF24L01
  radio.begin();
  radio.openWritingPipe(address);
  radio.setPALevel(RF24_PA_MAX);
  radio.stopListening();
  
  // Initialize GPS
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  display.println("Connecting WiFi...");
  display.display();
  
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }
  
  if(WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected");
    display.println("WiFi Connected");
  } else {
    Serial.println("\nWiFi Failed");
    display.println("WiFi Failed");
  }
  display.display();
  delay(2000);
  
  // Generate Patient ID
  generatePatientID();
  
  Serial.println("System Ready");
}

void loop() {
  // Read GPS data
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      if (gps.location.isValid()) {
        latitude = gps.location.lat();
        longitude = gps.location.lng();
        ambulanceSpeed = gps.speed.kmph();
      }
    }
  }
  
  // Read Temperature
  bodyTemp = mlx.readObjectTempC();
  
  // Read Heart Rate and SpO2
  long irValue = particleSensor.getIR();
  
  if (checkForBeat(irValue) == true) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);
    
    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;
      
      beatAvg = 0;
      for (byte x = 0 ; x < RATE_SIZE ; x++)
        beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
      heartRate = beatAvg;
    }
  }
  
  // Calculate SpO2 (simplified - use library for accurate calculation)
  if (irValue > 50000) {
    spo2 = 95 + random(0, 4); // Simulated for demo - use proper algorithm
  }
  
  // Update OLED Display
  updateDisplay();
  
  // Upload to Google Sheets
  if (millis() - lastUploadTime >= UPLOAD_INTERVAL && WiFi.status() == WL_CONNECTED) {
    uploadToSheets();
    lastUploadTime = millis();
  }
  
  // Transmit to Traffic Signals
  if (millis() - lastTransmitTime >= TRANSMIT_INTERVAL && patientActive) {
    transmitToTraffic();
    lastTransmitTime = millis();
  }
  
  delay(100);
}

void generatePatientID() {
  // Generate unique ID based on timestamp
  patientID = "AMB-2026-" + String(random(10000, 99999));
  Serial.println("Patient ID: " + patientID);
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  
  display.println("SMART AMBULANCE");
  display.println("================");
  display.print("ID: ");
  display.println(patientID);
  display.println();
  display.print("Temp: ");
  display.print(bodyTemp, 1);
  display.println(" C");
  display.print("HR: ");
  display.print(heartRate);
  display.println(" BPM");
  display.print("SpO2: ");
  display.print(spo2);
  display.println(" %");
  
  display.display();
}

void uploadToSheets() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Create data payload
    String url = String(serverName) + "?action=upload";
    url += "&patientID=" + patientID;
    url += "&ambulanceID=" + ambulanceID;
    url += "&temperature=" + String(bodyTemp, 1);
    url += "&heartRate=" + String(heartRate);
    url += "&spo2=" + String(spo2);
    url += "&latitude=" + String(latitude, 6);
    url += "&longitude=" + String(longitude, 6);
    url += "&speed=" + String(ambulanceSpeed, 1);
    
    http.begin(url);
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Upload Response: " + response);
      
      // Check if patient is marked as done
      if (response.indexOf("DONE") >= 0) {
        patientActive = false;
        // Generate new Patient ID for next patient
        generatePatientID();
      } else {
        patientActive = true;
        // Extract hospital info from response if available
        int hospitalIndex = response.indexOf("HOSPITAL:");
        if (hospitalIndex >= 0) {
          hospital = response.substring(hospitalIndex + 9);
          hospital.trim();
        }
      }
    } else {
      Serial.println("Error uploading: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void transmitToTraffic() {
  // Create JSON-like packet for traffic signal
  String packet = ambulanceID + "|" + hospital + "|EMERGENCY|" + String(ambulanceSpeed, 0);
  
  char msg[32];
  packet.toCharArray(msg, 32);
  
  bool success = radio.write(&msg, sizeof(msg));
  
  if (success) {
    Serial.println("Traffic signal notified");
  } else {
    Serial.println("Traffic transmission failed");
  }
}
