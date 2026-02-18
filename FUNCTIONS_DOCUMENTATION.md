# Smart Ambulance System - Functions Documentation
## Complete Function Reference with Tree Structure

---

## 📋 Table of Contents
1. [Firmware Functions](#firmware-functions)
   - [Ambulance Unit (ambulance.ino)](#ambulance-unit)
   - [Traffic Unit (traffic.ino)](#traffic-unit)
2. [Website Functions](#website-functions)
   - [Ambulance Portal](#ambulance-portal)
   - [Hospital Portal](#hospital-portal)

---

# FIRMWARE FUNCTIONS

## 🚑 AMBULANCE UNIT (ambulance.ino)
> ESP32-based ambulance monitoring and communication system

```
ambulance.ino
│
├── SYSTEM LIFECYCLE FUNCTIONS
│   ├── setup()
│   │   └── Purpose: Initialize entire ambulance system
│   │   └── Steps:
│   │       ├── 1. initializeHardware() - Setup all sensors
│   │       ├── 2. loadConfiguration() - Load WiFi credentials from Flash
│   │       ├── 3. connectToWiFi() - Connect to network
│   │       ├── 4. buildAPIUrls() - Construct API endpoints
│   │       └── 5. fetchAmbulanceID() - Get ambulance ID from server
│   │
│   └── loop()
│       └── Purpose: Main execution cycle (every 100ms)
│       └── Tasks:
│           ├── Handle config mode web server
│           ├── Check for active patient (every 5s)
│           ├── Read sensors and update vitals (every 5s)
│           ├── Transmit to traffic signals
│           ├── Sample heart rate continuously
│           └── Handle manual mode button press
│
├── INITIALIZATION FUNCTIONS
│   ├── initializeHardware()
│   │   └── Purpose: Initialize all hardware components
│   │   └── Components:
│   │       ├── I2C bus for sensors
│   │       ├── OLED display (SSD1306)
│   │       ├── Temperature sensor (MLX90614)
│   │       ├── Pulse oximeter (MAX30102)
│   │       ├── NRF24L01 radio transceiver
│   │       ├── GPS serial port
│   │       └── BOOT button for manual control
│   │
│   ├── loadConfiguration()
│   │   └── Purpose: Load WiFi credentials from Flash memory
│   │   └── Reads: wifi_ssid, wifi_password, server_ip
│   │   └── Returns: void
│   │
│   ├── connectToWiFi()
│   │   └── Purpose: Connect to WiFi network
│   │   └── Returns: bool (true = success, false = failed)
│   │   └── On Failure: Enters configuration mode (AP)
│   │
│   └── buildAPIUrls()
│       └── Purpose: Construct API endpoint URLs
│       └── Creates:
│           ├── ambulanceIdAPI
│           ├── checkPatientAPI
│           └── updateVitalsAPI
│
├── CONFIGURATION MODE FUNCTIONS
│   ├── startConfigMode()
│   │   └── Purpose: Start Access Point for WiFi configuration
│   │   └── AP Details: SSID="AMB", Password="12345678"
│   │   └── Starts web server on port 80
│   │
│   ├── handleRoot()
│   │   └── Purpose: Serve configuration web page
│   │   └── Returns: HTML form for WiFi setup
│   │
│   ├── handleSave()
│   │   └── Purpose: Save WiFi credentials to Flash
│   │   └── Parameters: ssid, password, server_ip
│   │   └── Action: Restart ESP32 after saving
│   │
│   └── saveConfiguration()
│       └── Purpose: Write credentials to Flash memory
│       └── Uses: Preferences library
│
├── SERVER COMMUNICATION FUNCTIONS
│   ├── fetchAmbulanceID()
│   │   └── Purpose: Get ambulance ID using MAC address
│   │   └── API: get_ambulance_id.php?mac=XX:XX:XX:XX:XX:XX
│   │   └── Returns: bool (true if valid ID received)
│   │   └── Sets: ambulanceID, ambulanceIDValid
│   │
│   ├── checkForActivePatient()
│   │   └── Purpose: Check if ambulance has active patient
│   │   └── API: check_active_patient.php?ambulance_id=XXX
│   │   └── Returns: int (patient row ID, or 0 if none)
│   │   └── Sets: patientID, hospital, direction
│   │
│   └── uploadVitals()
│       └── Purpose: Send patient vitals to server
│       └── API: update_patient_vitals.php
│       └── Data: bodyTemp, heartRate, oxygenLevel, latitude, longitude
│       └── Method: POST
│
├── SENSOR READING FUNCTIONS
│   ├── readSensors()
│   │   └── Purpose: Read all sensor values
│   │   └── Updates:
│   │       ├── bodyTemp (from MLX90614)
│   │       ├── heartRate (from MAX30102)
│   │       └── oxygenLevel (SpO2 calculation)
│   │
│   ├── readTemperature()
│   │   └── Purpose: Read body temperature
│   │   └── Sensor: MLX90614 IR thermometer
│   │   └── Returns: float (Celsius)
│   │
│   ├── readHeartRate()
│   │   └── Purpose: Read heart rate
│   │   └── Sensor: MAX30102 pulse oximeter
│   │   └── Returns: int (BPM - beats per minute)
│   │   └── Uses: Moving average of last 4 readings
│   │
│   └── readOxygenLevel()
│       └── Purpose: Calculate SpO2 percentage
│       └── Sensor: MAX30102 (IR + Red LED readings)
│       └── Returns: int (95-99%)
│
├── DISPLAY FUNCTIONS
│   ├── updateDisplay()
│   │   └── Purpose: Update OLED display based on state
│   │   └── States: Init, WiFi Error, ID Error, No Patient, Active Patient
│   │   └── Rotates: Temp → Heart → SpO2 (every 3s)
│   │
│   ├── showWiFiError()
│   │   └── Purpose: Display WiFi connection failure
│   │   └── Shows: Error message with config instructions
│   │
│   ├── showError()
│   │   └── Purpose: Display generic error message
│   │   └── Parameters: title, line1, line2
│   │
│   ├── showNoPatient()
│   │   └── Purpose: Display "Waiting for patient" message
│   │   └── Shows: Ambulance ID and status
│   │
│   └── showVitals()
│       └── Purpose: Display patient vitals on OLED
│       └── Shows: Patient ID + one vital at a time
│       └── Cycles: Temperature → Heart Rate → SpO2
│
├── RADIO COMMUNICATION FUNCTIONS
│   ├── transmitToTraffic()
│   │   └── Purpose: Send ambulance info to traffic signals
│   │   └── Protocol: NRF24L01 radio (2.4GHz)
│   │   └── Message Format: "AMB-ID|DIRECTION|EMERGENCY|Speed"
│   │   └── Example: "AMB-MUM-1024|NORTH|EMERGENCY|45"
│   │   └── Transmission:
│   │       ├── Automatic Mode: Sends every 5 seconds when patient active
│   │       └── Manual Mode: Sends only when BOOT button pressed
│   │
│   └── buildTransmissionMessage()
│       └── Purpose: Construct radio message string
│       └── Returns: String containing ambulance data
│       └── Includes: ambulance ID, direction, speed
│
├── GPS FUNCTIONS
│   ├── readGPS()
│   │   └── Purpose: Read GPS coordinates
│   │   └── Hardware: GPS module via Serial2
│   │   └── Library: TinyGPS++
│   │   └── Returns: Updates latitude, longitude
│   │   └── Note: Currently uses placeholder values
│   │
│   └── calculateSpeed()
│       └── Purpose: Calculate ambulance speed
│       └── Source: GPS data
│       └── Returns: float (km/h)
│
└── UTILITY FUNCTIONS
    ├── selectMode()
    │   └── Purpose: Allow user to select Automatic or Manual mode
    │   └── Display: Shows mode options on OLED
    │   └── Sets: manualMode flag
    │
    ├── handleButtonPress()
    │   └── Purpose: Debounce and detect BOOT button press
    │   └── Button: GPIO 0 (active LOW)
    │   └── Action: Toggle manualTransmitting flag
    │
    └── blinkLED()
        └── Purpose: Status indication via built-in LED
        └── States: Transmitting, Error, Normal
```

---

## 🚦 TRAFFIC UNIT (traffic.ino)
> Arduino-based traffic signal controller with emergency override

```
traffic.ino
│
├── SYSTEM LIFECYCLE FUNCTIONS
│   ├── setup()
│   │   └── Purpose: Initialize traffic signal system
│   │   └── Steps:
│   │       ├── 1. Initialize WS2812 LED strip
│   │       ├── 2. Initialize NRF24L01 radio receiver
│   │       └── 3. Start normal traffic mode
│   │
│   └── loop()
│       └── Purpose: Main execution cycle (every 100ms)
│       └── Tasks:
│           ├── Listen for ambulance radio signals
│           ├── Process emergency signals
│           ├── Handle normal traffic light cycling
│           └── Handle emergency traffic override
│
├── SIGNAL PROCESSING FUNCTIONS
│   ├── processEmergencySignal()
│   │   └── Purpose: Parse ambulance message and activate emergency
│   │   └── Input: String "AMB-ID|DIRECTION|EMERGENCY|Speed"
│   │   └── Extracts: Direction (NORTH, EAST, SOUTH, WEST)
│   │   └── Action: Call enterEmergencyMode()
│   │
│   └── exitEmergencyMode()
│       └── Purpose: Return to normal traffic operation
│       └── Trigger: After 30 seconds of emergency mode
│       └── Action: Call startNormalMode()
│
├── TRAFFIC MODE FUNCTIONS
│   ├── startNormalMode()
│   │   └── Purpose: Begin normal traffic light cycling
│   │   └── Initial: NORTH direction gets green
│   │   └── Cycle: NORTH → EAST → SOUTH → WEST → repeat
│   │
│   ├── handleNormalMode()
│   │   └── Purpose: Manage normal traffic light timing
│   │   └── Timing:
│   │       ├── Green: 15 seconds per direction
│   │       └── Yellow: 3 seconds transition
│   │   └── Sequence: Green → Yellow → Next Direction
│   │
│   ├── enterEmergencyMode()
│   │   └── Purpose: Override traffic for ambulance
│   │   └── Action:
│   │       ├── Ambulance direction: GREEN light
│   │       ├── All other directions: RED light
│   │       └── Start 30-second emergency timer
│   │
│   └── handleEmergencyMode()
│       └── Purpose: Maintain emergency override
│       └── Checks: Timer expiration
│       └── Duration: 30 seconds, then auto-return to normal
│
├── LED CONTROL FUNCTIONS
│   ├── setTrafficLights()
│   │   └── Purpose: Set lights for all 4 directions
│   │   └── Parameters: greenDir (direction), isYellow (bool)
│   │   └── Logic:
│   │       ├── Green/Yellow: Active direction
│   │       └── Red: All other directions
│   │
│   ├── setAllLEDs()
│   │   └── Purpose: Set all LEDs to same color
│   │   └── Parameters: color (RED, YELLOW, GREEN, OFF)
│   │   └── Use: Clear display, error indication
│   │
│   └── setDirectionLEDs()
│       └── Purpose: Set LEDs for specific direction
│       └── Parameters: direction, color
│       └── LED Mapping:
│           ├── NORTH: LEDs 0-2 (Red, Yellow, Green)
│           ├── EAST:  LEDs 3-5
│           ├── SOUTH: LEDs 6-8
│           └── WEST:  LEDs 9-11
│
├── RADIO FUNCTIONS
│   ├── initRadio()
│   │   └── Purpose: Setup NRF24L01 receiver
│   │   └── Config: Address "00001", PA_MAX power
│   │   └── Mode: Listening (receiver)
│   │
│   └── receiveMessage()
│       └── Purpose: Read incoming radio data
│       └── Returns: String (ambulance message)
│       └── Timeout: Non-blocking
│
└── UTILITY FUNCTIONS
    ├── getDirectionFromString()
    │   └── Purpose: Convert string to Direction enum
    │   └── Input: "NORTH", "EAST", "SOUTH", "WEST"
    │   └── Returns: Direction enum value
    │
    └── blinkErrorPattern()
        └── Purpose: Indicate initialization error
        └── Pattern: Blink all LEDs red 5 times
```

---

# WEBSITE FUNCTIONS

## 🚑 AMBULANCE PORTAL

### JavaScript Functions (dashboard.js)
> Client-side logic for ambulance attendant dashboard

```
dashboard.js
│
├── SESSION & INITIALIZATION
│   ├── window.onload()
│   │   └── Purpose: Initialize dashboard on page load
│   │   └── Calls: checkSessionAndLoad(), loadHospitals()
│   │
│   ├── checkSessionAndLoad()
│   │   └── Purpose: Verify user authentication
│   │   └── API: check_session.php
│   │   └── Gets: ambulance_id, attendar_name
│   │   └── On Fail: Redirect to login page
│   │   └── On Success: Load patient data
│   │
│   └── loadHospitals()
│       └── Purpose: Fetch list of hospitals
│       └── API: get_hospitals.php
│       └── Stores: hospitalsList array
│
├── PATIENT DATA MANAGEMENT
│   ├── loadPatientData()
│   │   └── Purpose: Get active patient information
│   │   └── API: get_patients.php
│   │   └── Checks: Active patient (done=0) for this ambulance
│   │   └── On No Patient: Redirect to index.html
│   │   └── On Patient Found: Call renderDashboard()
│   │
│   ├── renderDashboard()
│   │   └── Purpose: Display patient vitals and info
│   │   └── Updates:
│   │       ├── Patient ID, Name, Age, Gender
│   │       ├── Contact, Blood Type, Medical History
│   │       ├── Temperature, Heart Rate, SpO2
│   │       ├── Hospital Destination, Direction
│   │       └── GPS Location, Speed
│   │   └── Calls: updateStatusBadge() for each vital
│   │
│   └── showNoPatientMessage()
│       └── Purpose: Display "No active patient" status
│       └── Hides: All patient cards
│       └── Shows: Informational message
│
├── VITALS MONITORING
│   ├── updateStatusBadge()
│   │   └── Purpose: Set color badge based on vital ranges
│   │   └── Parameters: elementId, value, minNormal, maxNormal
│   │   └── Logic:
│   │       ├── Normal (green): Within range
│   │       ├── Warning (yellow): Slightly out of range
│   │       └── Critical (red): Severely out of range
│   │   └── Applies to: Temperature, Heart Rate, SpO2
│   │
│   ├── getVitalStatus()
│   │   └── Purpose: Determine vital status class
│   │   └── Returns: 'normal', 'warning', 'critical'
│   │
│   └── formatVitalValue()
│       └── Purpose: Format vital for display
│       └── Examples: "98.6°F", "72 BPM", "98%"
│
├── PATIENT INFO EDITING
│   ├── editField()
│   │   └── Purpose: Enable inline editing of patient field
│   │   └── Parameters: fieldName (e.g., 'patient_name')
│   │   └── Action:
│   │       ├── Hide display span
│   │       ├── Show input field with current value
│   │       └── Show Save/Cancel buttons
│   │
│   ├── saveField()
│   │   └── Purpose: Save edited field to server
│   │   └── API: update_patient.php
│   │   └── Method: POST
│   │   └── Parameters: id, field, value
│   │   └── On Success: Update display, hide input
│   │   └── On Error: Show alert, restore original value
│   │
│   ├── cancelEdit()
│   │   └── Purpose: Cancel field editing
│   │   └── Action: Restore display, hide input
│   │
│   ├── openPatientDetailsModal()
│   │   └── Purpose: Open modal for batch patient editing
│   │   └── Shows: Form with all patient fields
│   │   └── Pre-fills: Current patient data
│   │
│   ├── closePatientDetailsModal()
│   │   └── Purpose: Close patient details modal
│   │   └── Resets: Form fields
│   │
│   ├── savePatientDetails()
│   │   └── Purpose: Save all patient fields from modal
│   │   └── Calls: updateFieldsSequentially()
│   │   └── Updates: Multiple fields via API
│   │
│   └── updateFieldsSequentially()
│       └── Purpose: Update patient fields one by one
│       └── Parameters: updates array, current index
│       └── Uses: Recursive calls for sequential updates
│       └── Reason: Prevent race conditions
│
├── AUTO-REFRESH & REAL-TIME
│   ├── startAutoRefresh()
│   │   └── Purpose: Enable automatic data refresh
│   │   └── Interval: 3 seconds
│   │   └── Calls: loadPatientData(), checkIncomingCalls()
│   │
│   ├── stopAutoRefresh()
│   │   └── Purpose: Stop automatic refresh
│   │   └── Use: Before navigation, during editing
│   │
│   └── checkIncomingCalls()
│       └── Purpose: Check for hospital video call requests
│       └── API: check_incoming_calls.php
│       └── On Call: Show popup with answer/reject options
│
├── VIDEO CALLING
│   ├── startVideoCall()
│   │   └── Purpose: Initiate video call with hospital
│   │   └── API: start_video_call.php
│   │   └── Parameters: caller_type='ambulance'
│   │   └── On Success: Open Jitsi Meet in new window
│   │
│   ├── answerIncomingCall()
│   │   └── Purpose: Accept hospital video call
│   │   └── API: update_call_status.php (status='accepted')
│   │   └── Action: Join Jitsi Meet room
│   │
│   ├── rejectIncomingCall()
│   │   └── Purpose: Decline hospital video call
│   │   └── API: update_call_status.php (status='rejected')
│   │
│   └── showIncomingCallPopup()
│       └── Purpose: Display incoming call notification
│       └── Shows: Hospital name, answer/reject buttons
│
├── SESSION MANAGEMENT
│   └── logout()
│       └── Purpose: End user session
│       └── API: logout.php
│       └── Action: Destroy session, redirect to login
│
└── UTILITY FUNCTIONS
    ├── restoreCard()
    │   └── Purpose: Restore field display after edit/error
    │   └── Parameters: fieldName, cardTitle, displayValue
    │
    ├── showAlert()
    │   └── Purpose: Display alert message to user
    │   └── Types: Success, Error, Warning, Info
    │
    └── formatTimestamp()
        └── Purpose: Format date/time for display
        └── Example: "2026-02-18 14:30:45"
```

### PHP API Functions (Website/api/)
> Server-side backend for ambulance portal

```
api/
│
├── AUTHENTICATION & SESSION
│   ├── login.php
│   │   └── Purpose: Authenticate ambulance attendant
│   │   └── Method: POST
│   │   └── Parameters: ambulance_id, password
│   │   └── Process:
│   │       ├── Verify credentials against database
│   │       ├── Create PHP session
│   │       └── Store ambulance_id, attendar_name in session
│   │   └── Returns: JSON {success, ambulance_id, attendar_name}
│   │
│   ├── check_session.php
│   │   └── Purpose: Verify active user session
│   │   └── Method: GET
│   │   └── Checks: $_SESSION variables
│   │   └── Returns: JSON {logged_in, ambulance_id, attendar_name}
│   │
│   └── logout.php
│       └── Purpose: End user session
│       └── Method: GET
│       └── Action: session_destroy()
│       └── Returns: JSON {success: true}
│
├── AMBULANCE IDENTIFICATION
│   └── get_ambulance_id.php
│       └── Purpose: Get ambulance ID from MAC address
│       └── Method: GET
│       └── Parameters: mac (ESP32 MAC address)
│       └── Query: SELECT ambulance_id FROM ambulances WHERE mac_address=?
│       └── Returns: JSON {success, ambulance_id}
│       └── Use: ESP32 firmware calls this on startup
│
├── PATIENT DATA RETRIEVAL
│   ├── check_active_patient.php
│   │   └── Purpose: Check if ambulance has active patient
│   │   └── Method: GET
│   │   └── Parameters: ambulance_id
│   │   └── Query: SELECT * FROM patients WHERE ambulance_id=? AND done=0
│   │   └── Returns: JSON {patient data} or {error}
│   │   └── Use: ESP32 firmware calls every 5 seconds
│   │
│   └── get_patients.php
│       └── Purpose: Get all active patients (for dashboard)
│       └── Method: GET
│       └── Session: Requires authenticated session
│       └── Query: SELECT * FROM patients WHERE done=0
│       └── Returns: JSON {patients: {ambulance_id: patient_data}}
│
├── PATIENT DATA UPDATE
│   ├── update_patient_vitals.php
│   │   └── Purpose: Update patient vital signs from ESP32
│   │   └── Method: POST
│   │   └── Parameters:
│   │       ├── ambulance_id
│   │       ├── temperature
│   │       ├── heart_rate
│   │       ├── oxygen_level
│   │       ├── latitude
│   │       └── longitude
│   │   └── Query: UPDATE patients SET... WHERE ambulance_id=? AND done=0
│   │   └── Returns: JSON {success, message}
│   │   └── Use: ESP32 sends vitals every 5 seconds
│   │
│   ├── update_patient.php
│   │   └── Purpose: Update single patient field (from dashboard)
│   │   └── Method: POST
│   │   └── Parameters: id (patient row ID), field, value
│   │   └── Allowed Fields:
│   │       ├── patient_name, patient_id, age, gender
│   │       ├── contact, blood_type, medical_history
│   │       └── hospital, direction
│   │   └── Query: UPDATE patients SET field=? WHERE id=?
│   │   └── Returns: JSON {success, message}
│   │
│   └── mark_patient_done.php
│       └── Purpose: Mark patient as reached hospital
│       └── Method: POST
│       └── Parameters: ambulance_id
│       └── Query: UPDATE patients SET done=1 WHERE ambulance_id=?
│       └── Returns: JSON {success, message}
│
├── SERVICE MANAGEMENT
│   └── start_service.php
│       └── Purpose: Create new patient record
│       └── Method: POST
│       └── Parameters:
│       │   ├── ambulance_id
│       │   ├── patient_name, patient_id
│       │   ├── age, gender, contact
│       │   ├── blood_type, medical_history
│       │   ├── hospital, direction
│       │   └── Initial vitals (optional)
│       └── Query: INSERT INTO patients (...)
│       └── Returns: JSON {success, patient_id}
│
├── HOSPITAL DATA
│   └── get_hospitals.php
│       └── Purpose: Get list of all hospitals
│       └── Method: GET
│       └── Query: SELECT * FROM hospitals
│       └── Returns: JSON {success, hospitals: [...]}
│       └── Hospital Fields: id, name, direction, address
│
├── VIDEO CALLING
│   ├── start_video_call.php
│   │   └── Purpose: Initiate video call request
│   │   └── Method: POST
│   │   └── Parameters: caller_type, patient_id
│   │   └── Process:
│   │       ├── Generate unique room_id
│   │       ├── Insert call record into video_calls table
│   │       └── Set status='initiated'
│   │   └── Returns: JSON {success, room_id, jitsi_url}
│   │
│   ├── check_incoming_calls.php
│   │   └── Purpose: Check for incoming call requests
│   │   └── Method: GET
│   │   └── Session: Requires authentication
│   │   └── Query: SELECT * FROM video_calls WHERE... status='initiated'
│   │   └── Returns: JSON {call_pending, call_data}
│   │
│   └── update_call_status.php
│       └── Purpose: Update call status (accepted/rejected/ended)
│       └── Method: POST
│       └── Parameters: call_id, status
│       └── Statuses: initiated, accepted, rejected, ended
│       └── Returns: JSON {success, message}
│
├── FILE UPLOAD
│   └── upload.php
│       └── Purpose: Upload patient documents/images
│       └── Method: POST (multipart/form-data)
│       └── Parameters: file, patient_id
│       └── Validates: File type, size
│       └── Stores: Files in uploads/ directory
│       └── Returns: JSON {success, file_path}
│
└── CONFIGURATION
    └── config.php
        └── Purpose: Database connection configuration
        └── Defines: DB credentials ($host, $user, $pass, $db)
        └── Function: getConnection() - Returns mysqli object
        └── Included by: All API files
```

---

## 🏥 HOSPITAL PORTAL

### JavaScript Functions (hospital/js/)
> Client-side logic for hospital dashboard

```
hospital/js/dashboard.js
│
├── SESSION & INITIALIZATION
│   ├── window.onload()
│   │   └── Purpose: Initialize hospital dashboard
│   │   └── Calls: checkSessionAndLoad()
│   │
│   └── checkSessionAndLoad()
│       └── Purpose: Verify hospital authentication
│       └── API: check_hospital_session.php
│       └── Gets: hospital_id, hospital_name
│       └── On Fail: Redirect to hospital login
│       └── On Success: Load patient data
│
├── PATIENT DATA MANAGEMENT
│   ├── loadPatientData()
│   │   └── Purpose: Get all incoming patients to this hospital
│   │   └── API: get_hospital_patients.php
│   │   └── Filters: Patients with hospital matching this hospital
│   │   └── Calls: renderDashboard()
│   │
│   ├── renderDashboard()
│   │   └── Purpose: Display all incoming ambulances
│   │   └── Layout: Grid of patient cards
│   │   └── Each Card Shows:
│   │       ├── Ambulance ID
│   │       ├── Patient Name, ID, Age, Gender
│   │       ├── Contact, Blood Type
│   │       ├── Current Vitals (Temp, HR, SpO2)
│   │       ├── GPS Location, Speed
│   │       ├── Medical History
│   │       └── Action buttons
│   │   └── Actions: Video Call, Mark Reached
│   │
│   └── showNoData()
│       └── Purpose: Display "No incoming patients" message
│       └── Shows: Informational card
│
├── VITALS STATUS FUNCTIONS
│   ├── getVitalStatus()
│   │   └── Purpose: Get CSS class for vital value
│   │   └── Parameters: value, min, max
│   │   └── Returns: 'normal', 'warning', 'critical'
│   │
│   ├── getVitalStatusText()
│   │   └── Purpose: Get text label for vital
│   │   └── Returns: 'Normal', 'Warning', 'Critical'
│   │
│   ├── getOxygenStatus()
│   │   └── Purpose: Determine SpO2 status
│   │   └── Ranges:
│   │       ├── ≥95%: Normal
│   │       ├── 90-94%: Warning
│   │       └── <90%: Critical
│   │
│   ├── getOxygenStatusText()
│   │   └── Purpose: Get text for SpO2 status
│   │
│   ├── getTempStatus()
│   │   └── Purpose: Determine temperature status
│   │   └── Ranges (Fahrenheit):
│   │       ├── 97-99°F: Normal
│   │       ├── 99-101°F: Warning
│   │       └── >101°F or <97°F: Critical
│   │
│   └── getTempStatusText()
│       └── Purpose: Get text for temperature status
│
├── VIDEO CALLING
│   ├── startVideoCall()
│   │   └── Purpose: Initiate call to ambulance
│   │   └── Parameters: patient_id
│   │   └── API: start_video_call.php
│   │   └── Caller Type: 'hospital'
│   │   └── On Success: Open Jitsi Meet window
│   │
│   ├── checkIncomingCalls()
│   │   └── Purpose: Check for calls from ambulance
│   │   └── API: check_incoming_calls.php
│   │   └── On Call: Show popup notification
│   │
│   ├── showIncomingCallPopup()
│   │   └── Purpose: Display incoming call alert
│   │   └── Shows: Ambulance ID, patient info
│   │
│   ├── hideIncomingCallPopup()
│   │   └── Purpose: Hide call notification
│   │
│   ├── answerCall()
│   │   └── Purpose: Accept incoming call from ambulance
│   │   └── API: update_call_status.php (status='accepted')
│   │   └── Action: Join Jitsi Meet room
│   │
│   └── rejectCall()
│       └── Purpose: Decline incoming call
│       └── API: update_call_status.php (status='rejected')
│
├── PATIENT STATUS
│   └── markPatientReachedHospital()
│       └── Purpose: Mark patient as arrived
│       └── Parameters: patient_id
│       └── Confirmation: "Patient has reached hospital?"
│       └── Action: Remove from active dashboard
│       └── Note: Currently updates locally (API integration pending)
│
├── AUTO-REFRESH
│   ├── startAutoRefresh()
│   │   └── Purpose: Enable automatic data refresh
│   │   └── Interval: 3 seconds
│   │   └── Calls: loadPatientData(), checkIncomingCalls()
│   │
│   └── stopAutoRefresh()
│       └── Purpose: Stop automatic refresh
│       └── Use: Before logout, during maintenance
│
├── SESSION MANAGEMENT
│   └── logout()
│       └── Purpose: End hospital session
│       └── API: hospital_logout.php
│       └── Action: Destroy session, redirect to login
│
└── PATIENT HISTORY
    └── loadPatientHistory()
        └── Purpose: View historical patient records
        └── API: get_hospital_patients_history.php
        └── Query: All patients with done=1 for this hospital
        └── Display: Table with past patients
```

### PHP API Functions (hospital/api/)
> Server-side backend for hospital portal

```
hospital/api/
│
├── AUTHENTICATION & SESSION
│   ├── hospital_login.php
│   │   └── Purpose: Authenticate hospital user
│   │   └── Method: POST
│   │   └── Parameters: hospital_id, password
│   │   └── Process:
│   │       ├── Verify credentials against hospitals table
│   │       ├── Create PHP session
│   │       └── Store hospital_id, hospital_name
│   │   └── Returns: JSON {success, hospital_id, hospital_name}
│   │
│   ├── check_hospital_session.php
│   │   └── Purpose: Verify active hospital session
│   │   └── Method: GET
│   │   └── Checks: $_SESSION['hospital_id']
│   │   └── Returns: JSON {logged_in, hospital_id, hospital_name}
│   │
│   └── hospital_logout.php
│       └── Purpose: End hospital session
│       └── Method: GET
│       └── Action: session_destroy()
│       └── Returns: JSON {success: true}
│
├── PATIENT DATA RETRIEVAL
│   ├── get_hospital_patients.php
│   │   └── Purpose: Get all incoming patients for this hospital
│   │   └── Method: GET
│   │   └── Session: Requires hospital authentication
│   │   └── Query: SELECT * FROM patients WHERE hospital=? AND done=0
│   │   └── Returns: JSON {success, patients: [...]}
│   │   └── Includes: All patient details and vitals
│   │
│   └── get_hospital_patients_history.php
│       └── Purpose: Get past patients (arrived at hospital)
│       └── Method: GET
│       └── Session: Requires hospital authentication
│       └── Query: SELECT * FROM patients WHERE hospital=? AND done=1
│       └── Returns: JSON {success, patients: [...]}
│       └── Order: Latest first (by timestamp)
│
├── VIDEO CALLING
│   ├── start_video_call.php
│   │   └── Purpose: Initiate call to ambulance
│   │   └── Method: POST
│   │   └── Parameters: caller_type='hospital', patient_id
│   │   └── Process: Same as ambulance portal
│   │   └── Returns: JSON {success, room_id, jitsi_url}
│   │
│   ├── check_incoming_calls.php
│   │   └── Purpose: Check for calls from ambulance
│   │   └── Method: GET
│   │   └── Session: Requires hospital authentication
│   │   └── Query: SELECT * FROM video_calls WHERE... status='initiated'
│   │   └── Returns: JSON {call_pending, call_data}
│   │
│   └── update_call_status.php
│       └── Purpose: Update call status
│       └── Method: POST
│       └── Parameters: call_id, status
│       └── Returns: JSON {success, message}
│
└── SHARED WITH AMBULANCE PORTAL
    └── (Uses same config.php for database connection)
```

---

## 📊 FUNCTION CALL FLOW DIAGRAMS

### Ambulance Startup Flow
```
ESP32 Powers On
    ↓
setup()
    ↓
initializeHardware() → Initialize I2C, OLED, Sensors, Radio, GPS
    ↓
loadConfiguration() → Load WiFi credentials from Flash
    ↓
connectToWiFi() → Connect to network
    ↓         ↓
   FAIL     SUCCESS
    ↓         ↓
startConfigMode()  buildAPIUrls()
(Access Point)     ↓
    ↓         fetchAmbulanceID()
    ↓         (Call get_ambulance_id.php)
    ↓         ↓
    ↓    Enter loop()
    ↓         ↓
    ↓    Check for active patient
    ↓    (Call check_active_patient.php)
    ↓         ↓
    ↓    Read sensors
    ↓    Upload vitals
    ↓    (Call update_patient_vitals.php)
    ↓    Transmit to traffic
    ↓
Config Web Server
(Wait for setup)
```

### Patient Monitoring Flow
```
loop() runs every 100ms
    ↓
Every 5 seconds:
    ↓
checkForActivePatient()
    ↓
API: check_active_patient.php
    ↓         ↓
NO PATIENT  PATIENT FOUND
    ↓         ↓
showNoPatient()  readSensors()
Display message  ├── readTemperature()
Return from loop ├── readHeartRate()
                 └── readOxygenLevel()
                 ↓
                 updateDisplay()
                 Show vitals on OLED
                 ↓
                 uploadVitals()
                 API: update_patient_vitals.php
                 ↓
                 transmitToTraffic()
                 Send via NRF24L01
```

### Traffic Signal Emergency Flow
```
Traffic in NORMAL_MODE
Cycling: NORTH → EAST → SOUTH → WEST
Green 15s, Yellow 3s
    ↓
radio.available() → Ambulance message received
    ↓
processEmergencySignal()
Parse: "AMB-ID|DIRECTION|EMERGENCY|Speed"
Extract direction
    ↓
enterEmergencyMode()
    ↓
Set ambulance direction → GREEN
Set all other directions → RED
Start 30-second timer
    ↓
handleEmergencyMode()
Monitor timer
    ↓
After 30 seconds:
    ↓
exitEmergencyMode()
    ↓
Return to NORMAL_MODE
```

### Dashboard Real-Time Update Flow
```
Dashboard Loads
    ↓
checkSessionAndLoad()
API: check_session.php
    ↓         ↓
NOT LOGGED  LOGGED IN
    ↓         ↓
Redirect to  loadPatientData()
index.html   API: get_patients.php
             ↓
             renderDashboard()
             Display all vitals
             ↓
             startAutoRefresh()
             ↓
             Every 3 seconds:
             ├── loadPatientData()
             │   (Get latest vitals)
             │   ↓
             │   updateStatusBadge()
             │   (Update color indicators)
             │
             └── checkIncomingCalls()
                 (Check for video calls)
                 ↓
                 showIncomingCallPopup()
                 (If call detected)
```

---

## 🔗 API ENDPOINTS QUICK REFERENCE

### Ambulance Portal APIs
| Endpoint | Method | Called By | Purpose |
|----------|--------|-----------|---------|
| `get_ambulance_id.php` | GET | ESP32 | Get ambulance ID from MAC |
| `check_active_patient.php` | GET | ESP32 | Check for active patient |
| `update_patient_vitals.php` | POST | ESP32 | Upload sensor readings |
| `login.php` | POST | Web | Attendant login |
| `check_session.php` | GET | Web | Verify session |
| `logout.php` | GET | Web | End session |
| `get_patients.php` | GET | Web | Get all active patients |
| `update_patient.php` | POST | Web | Update patient field |
| `mark_patient_done.php` | POST | Web | Mark patient arrived |
| `start_service.php` | POST | Web | Create new patient |
| `get_hospitals.php` | GET | Web | Get hospital list |
| `start_video_call.php` | POST | Web | Initiate video call |
| `check_incoming_calls.php` | GET | Web | Check for incoming calls |
| `update_call_status.php` | POST | Web | Update call status |

### Hospital Portal APIs
| Endpoint | Method | Called By | Purpose |
|----------|--------|-----------|---------|
| `hospital_login.php` | POST | Web | Hospital login |
| `check_hospital_session.php` | GET | Web | Verify hospital session |
| `hospital_logout.php` | GET | Web | End hospital session |
| `get_hospital_patients.php` | GET | Web | Get incoming patients |
| `get_hospital_patients_history.php` | GET | Web | Get past patients |
| `start_video_call.php` | POST | Web | Initiate call to ambulance |
| `check_incoming_calls.php` | GET | Web | Check for calls from ambulance |
| `update_call_status.php` | POST | Web | Update call status |

---

## 📝 NOTES

### Firmware Notes
- **Manual Mode**: Press BOOT button to toggle NRF transmission on/off (for demos)
- **Automatic Mode**: Default mode, transmits continuously when patient is active
- **Configuration Mode**: Entered automatically if WiFi fails, creates AP "AMB"
- **Flash Memory**: WiFi credentials persisted across reboots using Preferences library

### Website Notes
- **Sessions**: PHP sessions used for authentication (ambulance and hospital portals)
- **Real-Time**: Auto-refresh every 3 seconds keeps data current
- **Video Calls**: Jitsi Meet integration for ambulance-hospital communication
- **Inline Editing**: Dashboard allows editing patient info without page reload

### Traffic Signal Notes
- **Normal Timing**: 15s green, 3s yellow per direction
- **Emergency Override**: 30s green for ambulance direction, auto-return to normal
- **Direction Mapping**: NORTH=0, EAST=1, SOUTH=2, WEST=3
- **LED Strip**: WS2812 RGB LEDs, 3 per direction (Red, Yellow, Green)

---

**Document Version**: 1.0  
**Last Updated**: February 18, 2026  
**System**: Smart Ambulance Emergency Response System
