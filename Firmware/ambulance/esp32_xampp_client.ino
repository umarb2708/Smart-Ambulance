/*
 * Smart Ambulance System - ESP32 Client Example
 * 
 * This example shows how to send sensor data to the PHP backend
 * Compatible with: ESP32, NodeMCU ESP8266
 * 
 * Required Libraries:
 * - WiFi.h (built-in)
 * - HTTPClient.h (built-in)
 */

#include <WiFi.h>
#include <HTTPClient.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // Replace with your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Replace with your WiFi password

// Server Configuration
// Find your PC's local IP: Open CMD → type 'ipconfig' → look for IPv4 Address
const char* serverUrl = "http://192.168.1.100/smart_ambulance/api/upload.php";  // UPDATE THIS!

// Patient Configuration
const char* patientID = "P001";           // Unique patient identifier
const char* ambulanceID = "AMB-001";      // Ambulance identifier
const char* hospital = "Hospital 1";      // Destination hospital

// Sensor pins (example - adjust to your hardware)
#define TEMP_SENSOR_PIN 34
#define O2_SENSOR_PIN 35
#define HR_SENSOR_PIN 36

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("Smart Ambulance System - ESP32");
  Serial.println("=================================\n");
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Server URL: ");
    Serial.println(serverUrl);
  } else {
    Serial.println("\n✗ WiFi Connection Failed!");
    Serial.println("Please check your WiFi credentials");
  }
  
  Serial.println("\n=================================\n");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    WiFi.begin(ssid, password);
    delay(5000);
    return;
  }
  
  // Read sensor data
  float temperature = readTemperature();      // °C
  int oxygenLevel = readOxygenLevel();        // SpO2 %
  int heartRate = readHeartRate();            // BPM
  float speed = readSpeed();                  // km/h
  float longitude = readGPSLongitude();       // GPS
  float latitude = readGPSLatitude();         // GPS
  
  // Display readings
  Serial.println("--- Sensor Readings ---");
  Serial.printf("Temperature: %.1f °C\n", temperature);
  Serial.printf("Oxygen Level: %d %%\n", oxygenLevel);
  Serial.printf("Heart Rate: %d BPM\n", heartRate);
  Serial.printf("Speed: %.1f km/h\n", speed);
  Serial.printf("GPS: %.6f, %.6f\n", latitude, longitude);
  Serial.println();
  
  // Send to server
  sendDataToServer(temperature, oxygenLevel, heartRate, speed, longitude, latitude);
  
  // Wait 5 seconds before next reading
  delay(5000);
}

/**
 * Send sensor data to PHP server
 */
void sendDataToServer(float temp, int o2, int hr, float spd, float lon, float lat) {
  HTTPClient http;
  
  Serial.print("Sending data to server... ");
  
  // Initialize HTTP connection
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  // Build POST data
  String postData = "patientID=" + String(patientID);
  postData += "&temperature=" + String(temp, 1);
  postData += "&oxygenLevel=" + String(o2);
  postData += "&heartRate=" + String(hr);
  postData += "&ambulanceID=" + String(ambulanceID);
  postData += "&speed=" + String(spd, 1);
  postData += "&longitude=" + String(lon, 6);
  postData += "&latitude=" + String(lat, 6);
  postData += "&hospital=" + String(hospital);
  
  // Send POST request
  int httpCode = http.POST(postData);
  
  // Check response
  if (httpCode > 0) {
    Serial.printf("HTTP %d - ", httpCode);
    
    String response = http.getString();
    Serial.println("Response: " + response);
    
    if (httpCode == 200) {
      Serial.println("✓ Data sent successfully!");
    } else {
      Serial.println("✗ Server error!");
    }
  } else {
    Serial.printf("✗ Connection failed! Error: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
  Serial.println();
}

/**
 * Read temperature from MLX90614 sensor
 * Replace this with your actual sensor reading code
 */
float readTemperature() {
  // Example: Read from MLX90614 or simulate
  // return mlx.readObjectTempC();
  
  // Simulated reading (36.0 - 39.0 °C)
  return 36.0 + (random(0, 30) / 10.0);
}

/**
 * Read oxygen level from MAX30102 sensor
 * Replace this with your actual sensor reading code
 */
int readOxygenLevel() {
  // Example: Read from MAX30102 or simulate
  // return particleSensor.getSpO2();
  
  // Simulated reading (90 - 100%)
  return 90 + random(0, 11);
}

/**
 * Read heart rate from MAX30102 sensor
 * Replace this with your actual sensor reading code
 */
int readHeartRate() {
  // Example: Read from MAX30102 or simulate
  // return particleSensor.getHeartRate();
  
  // Simulated reading (60 - 120 BPM)
  return 60 + random(0, 61);
}

/**
 * Read speed from GPS module
 * Replace this with your actual GPS reading code
 */
float readSpeed() {
  // Example: Read from GPS module or simulate
  // return gps.speed.kmph();
  
  // Simulated reading (0 - 80 km/h)
  return random(0, 81);
}

/**
 * Read GPS longitude
 * Replace this with your actual GPS reading code
 */
float readGPSLongitude() {
  // Example: Read from GPS module or simulate
  // return gps.location.lng();
  
  // Simulated reading (example: Bangalore, India)
  return 77.5946 + (random(-100, 100) / 10000.0);
}

/**
 * Read GPS latitude
 * Replace this with your actual GPS reading code
 */
float readGPSLatitude() {
  // Example: Read from GPS module or simulate
  // return gps.location.lat();
  
  // Simulated reading (example: Bangalore, India)
  return 12.9716 + (random(-100, 100) / 10000.0);
}
