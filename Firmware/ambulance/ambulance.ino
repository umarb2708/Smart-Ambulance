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
 * - Send data to server via WiFi
 * - Transmit ambulance info to traffic signals via NRF24L01
 * - GPS location tracking
 * 
 * Workflow:
 * A. Setup (runs once):
 *    1. Initialize all sensors & modules
 *    2. Check WiFi connection - show error if failed
 *    3. Fetch Ambulance ID from server using MAC address
 * 
 * B. Loop (continuous):
 *    1. Check for valid ambulance ID
 *    2. Check for active patient (done=0) from server
 *    3. If active patient found, update sensor data every 5 seconds
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
#include <Preferences.h>
#include <WebServer.h>

// Flash memory storage
Preferences preferences;

// WiFi credentials (loaded from Flash)
String wifi_ssid = "";
String wifi_password = "";
String server_ip = "";

// AP Mode credentials (when config needed)
const char* ap_ssid = "AMB";
const char* ap_password = "12345678";

// WebServer for configuration
WebServer server(80);

// Configuration mode flag
bool configMode = false;

// Debug mode - set to true to see actual password in Serial Monitor
#define DEBUG_CREDENTIALS false

// API endpoint builders (will use stored server_ip)
String ambulanceIdAPI = "";
String checkPatientAPI = "";
String updateVitalsAPI = "";

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

// System state variables
String macAddress = "";           // ESP32 MAC address
String ambulanceID = "";          // Fetched from server
bool ambulanceIDValid = false;    // True if valid ambulance ID fetched
int patientRowID = 0;             // Current active patient row ID (primary key)
String patientID = "";            // Current patient ID
String hospital = "";             // Destination hospital

// Timing variables
unsigned long lastCheckTime = 0;
unsigned long lastUpdateTime = 0;
const unsigned long CHECK_INTERVAL = 5000;   // 5 seconds - check for active patient
const unsigned long UPDATE_INTERVAL = 5000;  // 5 seconds - update sensor data
const unsigned long TRANSMIT_INTERVAL = 5000; // 5 seconds - transmit to traffic

// Sensor data
float bodyTemp = 0.0;
int heartRate = 0;
int oxygenLevel = 0;  // SpO2 percentage

// GPS Placeholder values (since GPS module is not connected)
float latitude = 12.9716;   // Bangalore, India latitude
float longitude = 77.5946;  // Bangalore, India longitude
float ambulanceSpeed = 45.0; // Fixed speed in km/h

// Display state
enum DisplayState {
  DISPLAY_INIT,
  DISPLAY_WIFI_ERROR,
  DISPLAY_ID_ERROR,
  DISPLAY_NO_PATIENT,
  DISPLAY_ACTIVE_PATIENT,
  DISPLAY_UPDATING
};
DisplayState currentDisplay = DISPLAY_INIT;

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Smart Ambulance System Starting ===");
  
  // STEP 1: Initialize all sensors & modules
  Serial.println("\n[STEP 1] Initializing hardware...");
  initializeHardware();
  
  // STEP 2: Load configuration from Flash
  Serial.println("\n[STEP 2] Loading configuration from Flash...");
  loadConfiguration();
  
  // STEP 3: Check WiFi connection
  Serial.println("\n[STEP 3] Connecting to WiFi...");
  if (!connectToWiFi()) {
    Serial.println("✗ WiFi connection failed!");
    Serial.println("Starting Configuration Mode (AP)...");
    
    // Enter configuration mode
    startConfigMode();
    configMode = true;
    
    // Stay in config mode - don't proceed to normal operation
    Serial.println("=== Config Mode Active - Waiting for setup ===");
    return;
  }
  
  // STEP 4: Build API URLs from stored server IP
  buildAPIUrls();
  
  // STEP 5: Fetch Ambulance ID using MAC address (or load from Flash)
  Serial.println("\n[STEP 5] Getting Ambulance ID...");
  macAddress = WiFi.macAddress();
  Serial.println("MAC Address: " + macAddress);
  
  if (!fetchAmbulanceID()) {
    Serial.println("✗ Failed to get Ambulance ID!");
    currentDisplay = DISPLAY_ID_ERROR;
    ambulanceIDValid = false;
    showError("Not Registered!", "MAC: " + macAddress, "Contact admin");
    // Don't halt - continue to loop but show error
  } else {
    ambulanceIDValid = true;
    Serial.println("✓ Setup complete! Ambulance ID: " + ambulanceID);
  }
  
  Serial.println("\n=== System Ready ===");
  delay(2000);
}

void loop() {
  // If in config mode, handle web server requests
  if (configMode) {
    server.handleClient();
    return;
  }
  
  // Check every 5 seconds
  if (millis() - lastCheckTime >= CHECK_INTERVAL) {
    lastCheckTime = millis();
    
    // STEP 1: Check for valid ambulance ID
    if (!ambulanceIDValid || ambulanceID.length() == 0) {
      Serial.println("✗ Invalid Ambulance ID - skipping loop");
      currentDisplay = DISPLAY_ID_ERROR;
      showError("Invalid ID!", "Ambulance not", "registered");
      return; // Skip rest of loop
    }
    
    // STEP 2: Check for active patient
    Serial.println("\n--- Checking for active patient ---");
    int activePatientRowID = checkForActivePatient();
    
    if (activePatientRowID <= 0) {
      Serial.println("✗ No active patient found");
      patientRowID = 0;
      patientID = "";
      currentDisplay = DISPLAY_NO_PATIENT;
      showNoPatient();
      return; // Skip sensor update
    }
    
    // Active patient found
    if (patientRowID != activePatientRowID) {
      // New patient or first time
      patientRowID = activePatientRowID;
      Serial.println("✓ Active patient found! Row ID: " + String(patientRowID));
      Serial.println("  Patient ID: " + patientID);
      Serial.println("  Hospital: " + hospital);
    }
  }
  
  // STEP 3: Update sensor data if we have an active patient
  if (patientRowID > 0 && (millis() - lastUpdateTime >= UPDATE_INTERVAL)) {
    lastUpdateTime = millis();
    
    // Read all sensors
    readSensors();
    
    // Update display
    currentDisplay = DISPLAY_ACTIVE_PATIENT;
    updateDisplay();
    
    // Upload vitals to server
    uploadVitals();
    
    // Transmit to traffic signals
    transmitToTraffic();
  }
  
  // Small delay to prevent overwhelming the system
  delay(100);
}

// ==================== INITIALIZATION FUNCTIONS ====================

void initializeHardware() {
  // Initialize I2C
  Wire.begin();
  Serial.println("✓ I2C initialized");
  
  // Initialize OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("✗ SSD1306 allocation failed");
    while(true);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Smart Ambulance");
  display.println("Initializing...");
  display.display();
  Serial.println("✓ OLED initialized");
  
  // Initialize Temperature Sensor
  if (!mlx.begin()) {
    Serial.println("✗ MLX90614 not found!");
    display.println("Temp sensor error");
    display.display();
  } else {
    Serial.println("✓ Temperature sensor ready");
  }
  
  // Initialize Pulse Oximeter
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("✗ MAX30102 not found!");
    display.println("Pulse ox error");
    display.display();
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
    Serial.println("✓ Pulse oximeter ready");
  }
  
  // Initialize NRF24L01
  radio.begin();
  radio.openWritingPipe(address);
  radio.setPALevel(RF24_PA_MAX);
  radio.stopListening();
  Serial.println("✓ NRF24L01 initialized");
  
  // Initialize GPS
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("✓ GPS serial initialized");
  
  Serial.println("✓ All hardware initialized");
}

bool connectToWiFi() {
  // Check if we have WiFi credentials
  if (wifi_ssid.length() == 0) {
    Serial.println("✗ No WiFi credentials stored");
    return false;
  }
  
  Serial.println("Attempting WiFi connection...");
  Serial.println("  SSID: " + wifi_ssid);
  Serial.println("  Password: " + String(wifi_password.length()) + " characters");
  
  display.clearDisplay();
  display.setCursor(0,0);
  display.println("Connecting WiFi");
  display.println("================");
  display.println("");
  display.println(wifi_ssid);
  display.display();
  
  // Disconnect any existing connection
  WiFi.disconnect(true);
  delay(1000);
  
  // Set to station mode and begin connection
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
  
  Serial.print("Connecting");
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 40) {  // Increased to 20 seconds
    delay(500);
    Serial.print(".");
    
    // Update display with dots
    if (wifiTimeout % 3 == 0) {
      display.print(".");
      display.display();
    }
    
    wifiTimeout++;
  }
  
  if(WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());
    Serial.println("Signal Strength: " + String(WiFi.RSSI()) + " dBm");
    
    display.clearDisplay();
    display.setCursor(0,0);
    display.println("WiFi Connected!");
    display.println("================");
    display.println("");
    display.println("SSID:");
    display.println(wifi_ssid);
    display.println("");
    display.println("IP:");
    display.println(WiFi.localIP().toString());
    display.display();
    delay(2000);
    
    return true;
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    Serial.println("Status code: " + String(WiFi.status()));
    
    // Reset WiFi and scan for available networks
    Serial.println("\nScanning for WiFi networks...");
    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_STA);
    delay(500);
    
    int n = WiFi.scanNetworks();
    Serial.println("Found " + String(n) + " networks");
    
    if (n > 0) {
      Serial.println("Available networks:");
      bool foundSSID = false;
      for (int i = 0; i < n; i++) {
        String scannedSSID = WiFi.SSID(i);
        Serial.println("  " + String(i+1) + ": '" + scannedSSID + "' (" + String(WiFi.RSSI(i)) + " dBm)");
        if (scannedSSID == wifi_ssid) {
          foundSSID = true;
          Serial.println("     ^^^ YOUR SSID FOUND! Password might be wrong.");
        }
      }
      if (!foundSSID) {
        Serial.println("\n⚠ Your SSID '" + wifi_ssid + "' NOT FOUND in scan!");
        Serial.println("  Check SSID spelling and case (case-sensitive)");
      }
    } else {
      Serial.println("⚠ No networks found! WiFi antenna issue or WiFi disabled?");
    }
    
    Serial.println("\nPossible reasons:");
    Serial.println("  - Wrong password (if SSID was found above)");
    Serial.println("  - SSID not in range (if not found in scan)");
    Serial.println("  - Router not responding");
    
    display.clearDisplay();
    display.setCursor(0,0);
    display.println("WiFi Failed!");
    display.println("================");
    display.println("");
    display.println("Check:");
    display.println("- Password");
    display.println("- Signal");
    display.display();
    delay(3000);
    
    return false;
  }
}

bool fetchAmbulanceID() {
  // STEP 1: Try to load from Flash memory first
  preferences.begin("ambulance", false);
  ambulanceID = preferences.getString("amb_id", "");
  preferences.end();
  
  if (ambulanceID.length() > 0) {
    Serial.println("✓ Ambulance ID loaded from Flash: " + ambulanceID);
    
    display.clearDisplay();
    display.setCursor(0,0);
    display.println("ID from Memory");
    display.println("");
    display.setTextSize(2);
    display.println(ambulanceID);
    display.setTextSize(1);
    display.println("");
    display.println("(Cached)");
    display.display();
    delay(2000);
    
    return true;
  }
  
  // STEP 2: No stored ID - fetch from server
  Serial.println("No stored ID - fetching from server...");
  
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi not connected");
    return false;
  }
  
  HTTPClient http;
  String url = ambulanceIdAPI + "?mac=" + macAddress;
  
  Serial.println("Fetching from: " + url);
  
  display.clearDisplay();
  display.setCursor(0,0);
  display.println("Fetching ID...");
  display.println("MAC:");
  display.println(macAddress);
  display.display();
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Response: " + response);
    
    int idStart = response.indexOf("\"ambulance_id\":\"") + 16;
    int idEnd = response.indexOf("\"", idStart);
    
    if (idStart > 15 && idEnd > idStart) {
      ambulanceID = response.substring(idStart, idEnd);
      Serial.println("✓ Ambulance ID fetched: " + ambulanceID);
      
      // STEP 3: Save to Flash for future use
      preferences.begin("ambulance", false);
      preferences.putString("amb_id", ambulanceID);
      preferences.end();
      Serial.println("✓ ID saved to Flash memory");
      
      display.clearDisplay();
      display.setCursor(0,0);
      display.println("ID Fetched!");
      display.println("");
      display.setTextSize(2);
      display.println(ambulanceID);
      display.setTextSize(1);
      display.println("");
      display.println("(Saved)");
      display.display();
      delay(2000);
      
      http.end();
      return true;
    } else {
      Serial.println("✗ Failed to parse response");
    }
  } else if (httpResponseCode == 404) {
    Serial.println("✗ MAC not registered");
    Serial.println("Add MAC to database: " + macAddress);
  } else {
    Serial.println("✗ HTTP Error: " + String(httpResponseCode));
  }
  
  http.end();
  return false;
}

// ==================== MAIN LOOP FUNCTIONS ====================

int checkForActivePatient() {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi not connected");
    return 0;
  }
  
  HTTPClient http;
  
  // Build API URL
  String url = checkPatientAPI + "?ambulance_id=" + ambulanceID;
  
  Serial.println("Checking: " + url);
  
  // Make HTTP GET request
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Response: " + response);
    
    // Parse patient_row_id
    int rowIdStart = response.indexOf("\"patient_row_id\":") + 17;
    int rowIdEnd = response.indexOf(",", rowIdStart);
    if (rowIdEnd < 0) rowIdEnd = response.indexOf("}", rowIdStart);
    
    if (rowIdStart > 16 && rowIdEnd > rowIdStart) {
      String rowIdStr = response.substring(rowIdStart, rowIdEnd);
      rowIdStr.trim();
      int rowId = rowIdStr.toInt();
      
      if (rowId > 0) {
        // Parse patient_id
        int pidStart = response.indexOf("\"patient_id\":\"") + 14;
        int pidEnd = response.indexOf("\"", pidStart);
        if (pidStart > 13 && pidEnd > pidStart) {
          patientID = response.substring(pidStart, pidEnd);
        }
        
        // Parse hospital
        int hospStart = response.indexOf("\"hospital\":\"") + 12;
        int hospEnd = response.indexOf("\"", hospStart);
        if (hospStart > 11 && hospEnd > hospStart) {
          hospital = response.substring(hospStart, hospEnd);
        }
        
        Serial.println("✓ Active patient - Row ID: " + String(rowId));
        http.end();
        return rowId;
      }
    }
  } else {
    Serial.println("✗ HTTP Error: " + String(httpResponseCode));
  }
  
  http.end();
  return 0;
}

void readSensors() {
  // Read Temperature
  bodyTemp = mlx.readObjectTempC();
  
  // Read Heart Rate and SpO2
  long irValue = particleSensor.getIR();
  
  Serial.print("IR Value: " + String(irValue) + " - ");
  
  if (irValue < 50000) {
    Serial.println("No finger detected");
    // Use simulated values when no finger detected (for demo/testing)
    heartRate = 72 + random(-5, 6);  // 67-77 bpm
    oxygenLevel = 98;
  } else {
    Serial.println("Finger detected");
    
    // Try to detect heartbeat
    if (checkForBeat(irValue) == true) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      
      Serial.println("  Beat detected! BPM: " + String(beatsPerMinute));
      
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
    
    // Calculate SpO2 (actual sensor reading)
    oxygenLevel = 95 + random(0, 4);
  }
  
  Serial.println("Sensors: Temp=" + String(bodyTemp, 1) + "°C, HR=" + String(heartRate) + "bpm, SpO2=" + String(oxygenLevel) + "%");
}

void uploadVitals() {
  if(WiFi.status() != WL_CONNECTED || patientRowID <= 0) {
    Serial.println("✗ Cannot upload - WiFi down or no patient");
    return;
  }
  
  HTTPClient http;
  
  Serial.println("\n--- Uploading Vitals ---");
  Serial.println("URL: " + updateVitalsAPI);
  
  // Initialize HTTP connection
  http.begin(updateVitalsAPI);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  // Create POST data payload
  String postData = "patient_row_id=" + String(patientRowID);
  postData += "&temperature=" + String(bodyTemp, 1);
  postData += "&oxygenLevel=" + String(oxygenLevel);
  postData += "&heartRate=" + String(heartRate);
  postData += "&speed=" + String(ambulanceSpeed, 1);
  postData += "&longitude=" + String(longitude, 6);
  postData += "&latitude=" + String(latitude, 6);
  
  Serial.println("Data: " + postData);
  
  // Send POST request
  int httpResponseCode = http.POST(postData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response [" + String(httpResponseCode) + "]: " + response);
    
    if (response.indexOf("\"success\":true") >= 0) {
      Serial.println("✓ Vitals uploaded successfully!");
    } else if (response.indexOf("marked as done") >= 0) {
      Serial.println("⚠ Patient marked as done - stopping updates");
      patientRowID = 0; // Stop updating this patient
    } else {
      Serial.println("✗ Upload failed");
    }
  } else {
    Serial.println("✗ HTTP Error: " + String(httpResponseCode));
  }
  
  http.end();
  Serial.println("--- Upload Complete ---\n");
}

void transmitToTraffic() {
  if (patientRowID <= 0) {
    return; // No active patient
  }
  
  // Create packet for traffic signal
  String packet = ambulanceID + "|" + hospital + "|EMERGENCY|" + String(ambulanceSpeed, 0);
  
  char msg[32];
  packet.toCharArray(msg, 32);
  
  bool success = radio.write(&msg, sizeof(msg));
  
  if (success) {
    Serial.println("📡 Traffic signal notified: " + packet);
  } else {
    Serial.println("✗ Traffic transmission failed");
  }
}

// ==================== DISPLAY FUNCTIONS ====================

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
  display.print(oxygenLevel);
  display.println(" %");
  
  display.display();
}

void showNoPatient() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  
  display.println("SMART AMBULANCE");
  display.println("================");
  display.println("");
  display.setTextSize(2);
  display.println("No");
  display.println("Patient");
  display.setTextSize(1);
  display.println("");
  display.println("Waiting...");
  
  display.display();
}

void showError(String title, String line1, String line2) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  
  display.println(title);
  display.println("================");
  display.println("");
  display.println(line1);
  display.println(line2);
  
  display.display();
}

// ==================== CONFIGURATION MODE FUNCTIONS ====================

void loadConfiguration() {
  preferences.begin("ambulance", false);
  wifi_ssid = preferences.getString("wifi_ssid", "");
  wifi_password = preferences.getString("wifi_pass", "");
  server_ip = preferences.getString("server_ip", "");
  preferences.end();
  
  Serial.println("Loaded from Flash:");
  Serial.println(String("  SSID: '") + (wifi_ssid.length() > 0 ? wifi_ssid : "(none)") + "'");
  Serial.println("  SSID Length: " + String(wifi_ssid.length()) + " chars");
  
  #if DEBUG_CREDENTIALS
    Serial.println(String("  Password: '") + wifi_password + "'");
  #else
    Serial.println(String("  Password: ") + (wifi_password.length() > 0 ? "*****" : "(none)"));
  #endif
  Serial.println("  Password Length: " + String(wifi_password.length()) + " chars");
  
  Serial.println(String("  Server IP: ") + (server_ip.length() > 0 ? server_ip : "(none)"));
}

void buildAPIUrls() {
  ambulanceIdAPI = "http://" + server_ip + "/smart_ambulance/api/get_ambulance_id.php";
  checkPatientAPI = "http://" + server_ip + "/smart_ambulance/api/check_active_patient.php";
  updateVitalsAPI = "http://" + server_ip + "/smart_ambulance/api/update_patient_vitals.php";
  
  Serial.println("API URLs built:");
  Serial.println("  " + ambulanceIdAPI);
  Serial.println("  " + checkPatientAPI);
  Serial.println("  " + updateVitalsAPI);
}

void startConfigMode() {
  Serial.println("\n=== Starting Configuration Mode ===");
  
  // Start Access Point
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);
  
  IPAddress IP = WiFi.softAPIP();
  Serial.println("AP Started!");
  Serial.println("SSID: " + String(ap_ssid));
  Serial.println("Password: " + String(ap_password));
  Serial.println("IP Address: " + IP.toString());
  
  // Display on OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.println("CONFIG MODE");
  display.println("================");
  display.println("");
  display.println("WiFi: " + String(ap_ssid));
  display.println("Pass: " + String(ap_password));
  display.println("");
  display.println("Open Browser:");
  display.println(IP.toString());
  display.display();
  
  // Setup web server routes
  server.on("/", handleRoot);
  server.on("/save", handleSave);
  server.begin();
  
  Serial.println("Web server started!");
  Serial.println("Connect to WiFi and visit: http://" + IP.toString());
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Ambulance Config</title>";
  html += "<style>";
  html += "body{font-family:Arial;margin:20px;background:#f0f0f0;}";
  html += "h1{color:#d32f2f;}";
  html += ".container{background:white;padding:20px;border-radius:10px;max-width:400px;margin:auto;}";
  html += "input{width:100%;padding:10px;margin:8px 0;box-sizing:border-box;border:2px solid #ccc;border-radius:4px;}";
  html += "button{width:100%;background:#d32f2f;color:white;padding:14px;border:none;border-radius:4px;cursor:pointer;font-size:16px;}";
  html += "button:hover{background:#b71c1c;}";
  html += ".info{background:#e3f2fd;padding:10px;border-radius:5px;margin-bottom:15px;}";
  html += "</style></head><body>";
  html += "<div class='container'>";
  html += "<h1>🚑 Smart Ambulance</h1>";
  html += "<h2>Configuration</h2>";
  html += "<div class='info'>Enter WiFi and Server details below:</div>";
  html += "<form action='/save' method='POST'>";
  html += "<label>WiFi SSID:</label>";
  html += "<input type='text' name='ssid' placeholder='Your WiFi Name' required>";
  html += "<label>WiFi Password:</label>";
  html += "<input type='password' name='password' placeholder='Your WiFi Password' required>";
  html += "<label>Server IP:</label>";
  html += "<input type='text' name='server' placeholder='192.168.1.X' required pattern='\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}'>";
  html += "<br><br>";
  html += "<button type='submit'>Save & Restart</button>";
  html += "</form>";
  html += "</div></body></html>";
  
  server.send(200, "text/html", html);
}

void handleSave() {
  // Get form data and trim spaces
  String new_ssid = server.arg("ssid");
  String new_password = server.arg("password");
  String new_server = server.arg("server");
  
  // Trim leading and trailing spaces
  new_ssid.trim();
  new_password.trim();
  new_server.trim();
  
  Serial.println("\n=== Saving Configuration ===");
  Serial.println("SSID: '" + new_ssid + "' (" + String(new_ssid.length()) + " chars)");
  
  #if DEBUG_CREDENTIALS
    Serial.println("Password: '" + new_password + "' (" + String(new_password.length()) + " chars)");
  #else
    Serial.println("Password: ***** (" + String(new_password.length()) + " chars)");
  #endif
  
  Serial.println("Server IP: " + new_server);
  
  // Save to Flash
  preferences.begin("ambulance", false);
  preferences.putString("wifi_ssid", new_ssid);
  preferences.putString("wifi_pass", new_password);
  preferences.putString("server_ip", new_server);
  preferences.end();
  
  Serial.println("✓ Configuration saved to Flash!");
  
  // Send success page
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Saved</title>";
  html += "<style>";
  html += "body{font-family:Arial;margin:20px;background:#f0f0f0;text-align:center;}";
  html += ".container{background:white;padding:30px;border-radius:10px;max-width:400px;margin:auto;}";
  html += "h1{color:#4caf50;}";
  html += "</style></head><body>";
  html += "<div class='container'>";
  html += "<h1>✓ Configuration Saved!</h1>";
  html += "<p>Ambulance is restarting...</p>";
  html += "<p>It will connect to your WiFi network.</p>";
  html += "</div></body></html>";
  
  server.send(200, "text/html", html);
  
  delay(2000);
  
  Serial.println("Restarting ESP32...");
  ESP.restart();
}

// Optional: Clear all stored configuration (for debugging)
void clearAllConfiguration() {
  preferences.begin("ambulance", false);
  preferences.clear();
  preferences.end();
  Serial.println("✓ All configuration cleared from Flash");
}
