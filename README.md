# Smart Ambulance System

A comprehensive IoT-based emergency response system that integrates smart traffic control, real-time patient monitoring, and cloud-connected healthcare communication.

---

## 1. Project Overview

The **Smart Ambulance System** is an intelligent emergency response solution designed to save lives through:

- **Real-time Patient Monitoring**: Continuous tracking of vital signs (temperature, heart rate, SpO2) using medical-grade sensors
- **Smart Traffic Management**: Automated traffic signal control to prioritize ambulance routes using RF communication
- **Cloud Connectivity**: Live data transmission to hospital dashboards for pre-arrival patient assessment
- **GPS Tracking**: Real-time ambulance location monitoring
- **Video Integration**: Emergency video consultation capabilities between ambulance and hospital staff

The system consists of three interconnected units:
1. **Ambulance Unit** - Sensor-equipped patient monitoring system with ESP32 controller
2. **Traffic Unit** - Arduino-based intelligent traffic signal control
3. **Hospital Unit** - Web-based real-time monitoring dashboard

---

## 2. Unit-Wise Data

### 2.a Ambulance Unit

#### i. Hardware Details

| Component | Model/Type | Purpose | Quantity |
|-----------|------------|---------|----------|
| Microcontroller | ESP32 NodeMCU | Main controller with WiFi | 1 |
| Temperature Sensor | MLX90614ESF IR Sensor | Non-contact body temperature | 1 |
| Pulse Oximeter | MAX30102 | Heart rate & SpO2 measurement | 1 |
| Display | 0.96" OLED (128x64) | Patient ID display | 1 |
| RF Transceiver | NRF24L01 (2.4GHz) | Traffic signal communication | 1 |
| GPS Module | NEO-6M/7M/8M | Location tracking | 1 |
| Power Supply | 5V USB or Battery | System power | 1 |
| Accessories | Breadboard, Jumper Wires | Connections | As needed |

**Required Arduino Libraries:**
- `Adafruit_MLX90614` - Temperature sensor
- `MAX30105` - Pulse oximeter
- `heartRate` - Heart rate calculation
- `Adafruit_GFX` - Display graphics
- `Adafruit_SSD1306` - OLED display
- `RF24` - NRF24L01 communication
- `WiFi` - Built-in ESP32
- `HTTPClient` - Built-in ESP32
- `TinyGPS++` - GPS parsing

#### ii. Pin Information

**ESP32 Pin Configuration:**

| Pin Type | GPIO Pin | Connected To | Function |
|----------|----------|--------------|----------|
| **I2C Bus** | GPIO 21 | MLX90614 SDA, MAX30102 SDA, OLED SDA | Data line (shared) |
| **I2C Bus** | GPIO 22 | MLX90614 SCL, MAX30102 SCL, OLED SCL | Clock line (shared) |
| **SPI (NRF24L01)** | GPIO 23 | NRF24L01 MOSI | Master Out Slave In |
| **SPI (NRF24L01)** | GPIO 19 | NRF24L01 MISO | Master In Slave Out |
| **SPI (NRF24L01)** | GPIO 18 | NRF24L01 SCK | SPI Clock |
| **SPI (NRF24L01)** | GPIO 4 | NRF24L01 CE | Chip Enable |
| **SPI (NRF24L01)** | GPIO 5 | NRF24L01 CSN | Chip Select |
| **Serial (GPS)** | GPIO 16 | GPS TX | GPS data receive |
| **Serial (GPS)** | GPIO 17 | GPS RX | GPS data transmit |
| **Power** | 3.3V | All I2C devices, NRF24L01 | Power supply |
| **Power** | 5V | GPS Module | Power supply |
| **Ground** | GND | All components | Common ground |

**Detailed Wiring Diagram:**

```
MLX90614 Temperature Sensor (I2C)
├─ VCC  → ESP32 3.3V
├─ GND  → ESP32 GND
├─ SDA  → ESP32 GPIO 21
└─ SCL  → ESP32 GPIO 22

MAX30102 Pulse Oximeter (I2C)
├─ VIN  → ESP32 3.3V
├─ GND  → ESP32 GND
├─ SDA  → ESP32 GPIO 21 (shared)
└─ SCL  → ESP32 GPIO 22 (shared)

OLED Display 128x64 (I2C)
├─ VCC  → ESP32 3.3V
├─ GND  → ESP32 GND
├─ SDA  → ESP32 GPIO 21 (shared)
└─ SCL  → ESP32 GPIO 22 (shared)

NRF24L01 RF Transceiver (SPI) ⚠️ ADD 10µF CAPACITOR!
├─ VCC  → ESP32 3.3V + 10µF capacitor to GND
├─ GND  → ESP32 GND
├─ CE   → ESP32 GPIO 4
├─ CSN  → ESP32 GPIO 5
├─ SCK  → ESP32 GPIO 18
├─ MOSI → ESP32 GPIO 23
└─ MISO → ESP32 GPIO 19

GPS Module NEO-6M (Serial)
├─ VCC  → ESP32 5V
├─ GND  → ESP32 GND
├─ TX   → ESP32 GPIO 16 (RX2)
└─ RX   → ESP32 GPIO 17 (TX2)
```

**Critical Notes:**
- ⚠️ NRF24L01 operates at **3.3V ONLY** - 5V will destroy it
- ⚠️ **MUST** add 10µF capacitor between NRF24L01 VCC and GND
- All I2C devices share the same SDA/SCL bus
- Keep NRF24L01 wires short (< 10cm) for stable operation
- Common ground required for all components

#### iii. Software/Website Details

**Firmware Location:** `Firmware/ambulance/ambulance.ino`

**WiFi Configuration:**
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

**Server Configuration:**
```cpp
const char* serverIP = "192.168.1.XXX";  // Your PC's local IP
const char* ambulanceIdAPI = "http://192.168.1.XXX/smart_ambulance/api/get_ambulance_id.php";
const char* checkPatientAPI = "http://192.168.1.XXX/smart_ambulance/api/check_active_patient.php";
const char* updateVitalsAPI = "http://192.168.1.XXX/smart_ambulance/api/update_patient_vitals.php";
```

**Web Dashboard Features:**
- Real-time patient vital signs display
- Auto-refresh every 10 seconds
- Video call integration
- Patient data entry form
- Status monitoring (Normal/Warning/Critical)

**API Endpoints:**
- `get_ambulance_id.php` - Fetch ambulance ID using MAC address
- `check_active_patient.php` - Check for active patient assignments
- `update_patient_vitals.php` - Update sensor readings
- `start_service.php` - Initialize patient service
- `mark_patient_done.php` - Complete patient handover

**Database:** MySQL (XAMPP)
- Database Name: `smart_ambulance`
- Main Tables: `ambulances`, `patients`, `hospitals`, `users`

---

### 2.b Traffic Unit

#### i. Hardware Details

| Component | Model/Type | Purpose | Quantity |
|-----------|------------|---------|----------|
| Microcontroller | Arduino Nano R3 (CH340) | Traffic control logic | 1 |
| RF Transceiver | NRF24L01 (2.4GHz) | Receive ambulance signals | 1 |
| LED Strip | WS2812 RGB (4 LEDs) | 4-way traffic lights | 1 |
| Power Supply | 5V Adapter/USB | System power | 1 |
| Accessories | Breadboard, Jumper Wires | Connections | As needed |

**Required Arduino Libraries:**
- `RF24` - NRF24L01 communication
- `Adafruit_NeoPixel` - WS2812 LED control

**LED Configuration:**
- LED 0: North Direction
- LED 1: East Direction
- LED 2: South Direction
- LED 3: West Direction

#### ii. Pin Information

**Arduino Nano Pin Configuration:**

| Pin Number | Connected To | Function |
|------------|--------------|----------|
| Pin 9 | NRF24L01 CE | Chip Enable |
| Pin 10 | NRF24L01 CSN | Chip Select |
| Pin 11 | NRF24L01 MOSI | SPI Data Out (Hardware SPI) |
| Pin 12 | NRF24L01 MISO | SPI Data In (Hardware SPI) |
| Pin 13 | NRF24L01 SCK | SPI Clock (Hardware SPI) |
| Pin 6 | WS2812 Data In | LED strip control |
| 3.3V | NRF24L01 VCC | Power (⚠️ NOT 5V) |
| 5V | WS2812 VCC | Power |
| GND | All components | Common ground |

**Detailed Wiring Diagram:**

```
NRF24L01 RF Transceiver (SPI) ⚠️ ADD 10µF CAPACITOR!
├─ VCC  → Arduino 3.3V + 10µF capacitor to GND
├─ GND  → Arduino GND
├─ CE   → Arduino Pin 9
├─ CSN  → Arduino Pin 10
├─ SCK  → Arduino Pin 13
├─ MOSI → Arduino Pin 11
└─ MISO → Arduino Pin 12

WS2812 RGB LED Strip
├─ VCC  → Arduino 5V (or external 5V supply)
├─ GND  → Arduino GND
└─ DIN  → Arduino Pin 6

Power Supply
├─ 5V   → Arduino VIN or USB
└─ GND  → Arduino GND
```

**Critical Notes:**
- ⚠️ NRF24L01 uses 3.3V power (NOT 5V)
- ⚠️ Add 10µF capacitor between NRF24L01 VCC and GND
- For more than 4 LEDs, use external 5V power supply for WS2812
- Estimate 60mA per LED at full brightness

**Firmware Location:** `Firmware/traffic/traffic.ino`

**Operating Modes:**
1. **Normal Mode:** Cyclic traffic light operation (15 seconds per direction)
2. **Emergency Mode:** Prioritize ambulance direction (green light), others red
3. **Auto Return:** Returns to normal mode after 30 seconds

**Hospital-to-Direction Mapping:**
```cpp
Hospital 1 → North (LED 0)
Hospital 2 → East  (LED 1)
Hospital 3 → South (LED 2)
Hospital 4 → West  (LED 3)
```

---

### 2.c Hospital Unit

#### i. Software/Website Details

**Dashboard Location:** `Website/hospital/dashboard.html`

**Features:**
- Real-time incoming ambulance monitoring
- Patient vital signs display
- Ambulance location and speed tracking
- Video call initiation
- Patient arrival confirmation
- Auto-refresh every 10 seconds

**Login System:**
- Location: `Website/hospital/index.html`
- Username/Password authentication
- Session management
- Hospital-specific data filtering

**API Endpoints:**
- `hospital_login.php` - Hospital staff authentication
- `get_hospital_patients.php` - Fetch incoming patients
- `check_incoming_calls.php` - Video call status
- `start_video_call.php` - Initiate video consultation
- `update_call_status.php` - Update call state
- `hospital_logout.php` - End session

**Technology Stack:**
- Frontend: HTML5, CSS3, JavaScript
- Backend: PHP 7.4+
- Database: MySQL (via XAMPP)
- Server: Apache (XAMPP)

**Installation:**
1. Install XAMPP (Apache + MySQL)
2. Copy files to `C:\xampp\htdocs\smart_ambulance\`
3. Import database: `database.sql`
4. Access: `http://localhost/smart_ambulance/hospital/`

**Sample Hospital Login:**
```
Username: hospital1
Password: hospital123
```

---

## 3. Working Details

### System Workflow

#### A. Initial Setup Phase

1. **Ambulance Unit Initialization**
   - ESP32 powers on and initializes all sensors
   - Connects to WiFi network
   - Retrieves Ambulance ID from server using MAC address
   - Displays status on OLED screen
   - Enters standby mode

2. **Hospital Staff Action**
   - Hospital staff logs into dashboard
   - Creates new patient entry with ambulance assignment
   - System generates unique Patient ID
   - Patient marked as "active" (done=0)

3. **Ambulance Receives Assignment**
   - ESP32 polls server every 5 seconds
   - Detects active patient assignment
   - Displays Patient ID on OLED
   - Begins sensor monitoring

#### B. Real-Time Monitoring Phase

1. **Vital Signs Collection (Every 5 seconds)**
   - MLX90614 reads body temperature
   - MAX30102 measures heart rate and SpO2
   - GPS captures current location and speed
   - Data displayed on OLED

2. **Data Transmission**
   - ESP32 sends sensor data to server via HTTP POST
   - Server updates database with latest vitals
   - Hospital dashboard auto-refreshes and displays data
   - Status calculated: Normal (green), Warning (yellow), Critical (red)

3. **Traffic Signal Control**
   - ESP32 transmits RF signal via NRF24L01
   - Message format: `"AMB-ID|Hospital|EMERGENCY|Speed"`
   - Arduino Nano at traffic signals receives data
   - Identifies hospital destination
   - Maps to traffic direction (North/East/South/West)

#### C. Emergency Traffic Override

1. **Normal Traffic Mode**
   - WS2812 LEDs cycle through 4 directions
   - Each direction green for 15 seconds
   - Yellow transition for 3 seconds

2. **Emergency Detection**
   - Arduino receives ambulance RF signal
   - Extracts destination hospital
   - Identifies required direction

3. **Priority Activation**
   - Sets ambulance direction to GREEN
   - Sets all other directions to RED
   - Maintains for 30 seconds
   - Returns to normal cycling after timeout

4. **Multi-Ambulance Handling**
   - Last received signal takes priority
   - Timer resets on new ambulance detection

#### D. Hospital Monitoring

1. **Dashboard Display**
   - Shows all incoming ambulances
   - Patient details and vital signs
   - Color-coded health status
   - Estimated arrival time
   - Real-time location map

2. **Critical Alerts**
   - Automatic highlighting of abnormal vitals
   - Temperature > 100°F: Red alert
   - Heart Rate > 100 or < 60: Warning
   - SpO2 < 95%: Critical

3. **Video Consultation**
   - Hospital initiates video call
   - Uses Google Meet integration
   - Real-time communication with ambulance staff
   - Pre-arrival medical guidance

#### E. Patient Handover

1. **Arrival Confirmation**
   - Hospital staff clicks "Patient Arrived"
   - System marks patient as done (done=1)
   - Ambulance unit detects completion
   - OLED shows "No Active Patient"

2. **Data Archival**
   - All vitals logged in database
   - Historical records maintained
   - Reports available for analysis

3. **System Reset**
   - Ambulance returns to standby
   - Ready for next assignment
   - Traffic signals resume normal operation

### Data Flow Diagram

```
┌─────────────┐         WiFi/HTTP        ┌──────────────┐
│  Ambulance  │ ───────────────────────> │   Server     │
│    ESP32    │ < ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  (XAMPP)     │
│   Sensors   │                           │   MySQL DB   │
└──────┬──────┘                           └───────┬──────┘
       │                                          │
       │ RF (NRF24L01)                           │ HTTP
       │ 2.4GHz                                  │
       v                                          v
┌─────────────┐                           ┌──────────────┐
│   Traffic   │                           │   Hospital   │
│   Arduino   │                           │  Dashboard   │
│   WS2812    │                           │  (Browser)   │
└─────────────┘                           └──────────────┘
```

### Key Technologies

- **Communication:** WiFi (ESP32 ↔ Server), RF 2.4GHz (ESP32 ↔ Arduino), HTTP/HTTPS
- **Sensors:** I2C protocol, SPI protocol, UART serial
- **Database:** MySQL with PHP backend
- **Frontend:** HTML5, CSS3, JavaScript (AJAX)
- **Microcontrollers:** ESP32 (32-bit dual-core), Arduino Nano (ATmega328P)

### Power Consumption

- **Ambulance Unit:** ~500mA @ 5V (2.5W) - USB powered or battery
- **Traffic Unit:** ~300mA @ 5V (1.5W) - Can run on power bank

### Range Specifications

- **WiFi Range:** Up to 100m (open area)
- **NRF24L01 RF Range:** Up to 100m (line of sight)
- **GPS Accuracy:** ±2.5m CEP

---

## Quick Start

1. **Setup Database:** Import `Website/database.sql` into MySQL
2. **Configure Server:** Update IP addresses in firmware files
3. **Upload Code:** Flash `ambulance.ino` to ESP32, `traffic.ino` to Arduino Nano
4. **Start Services:** Run XAMPP (Apache + MySQL)
5. **Access Dashboards:**
   - Ambulance: `http://localhost/smart_ambulance/`
   - Hospital: `http://localhost/smart_ambulance/hospital/`

---

## System Requirements

- **Arduino IDE:** Version 1.8.13 or higher
- **ESP32 Board Support:** Install via Board Manager
- **XAMPP:** Version 7.4 or higher (Apache + MySQL + PHP)
- **Web Browser:** Chrome, Firefox, or Edge (latest versions)
- **Operating System:** Windows 10/11, macOS, or Linux

---

## Troubleshooting

**WiFi Connection Failed:**
- Verify SSID and password in code
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check router firewall settings

**NRF24L01 Not Working:**
- Verify 10µF capacitor installed
- Check 3.3V power (NOT 5V)
- Keep wires short (<10cm)
- Test with RF24 example sketches

**Sensor Not Detected:**
- Run I2C scanner to verify addresses
- Check SDA/SCL connections
- Ensure common ground

**Database Connection Error:**
- Start Apache and MySQL in XAMPP
- Verify database name: `smart_ambulance`
- Check `config.php` credentials

---

## License

This project is open-source for educational and non-commercial use.

## Contributors

Developed as part of Smart Healthcare IoT initiatives.

---

**Last Updated:** January 2026  
**Version:** 2.0
2. Name it "Smart Ambulance Database"
3. Create a sheet named "DataBase" (exact name)
4. Add the following headers in row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Date | Patient Name | Patient Age | Patient Blood Group | Patient ID | Patient Status | Temperature | Oxygen Level | Heart Rate | Blood Pressure | Diabetics Level | Ambulance ID | Ambulance Speed | Ambulance Long | Ambulance Latti | Next Traffic Int | Past Traffic Int | Hospital | Done |

### 2. Deploy Apps Script (Ambulance)

1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. Delete any existing code
4. Copy the entire content from `Website/ambulance.gs`
5. Update the `SHEET_ID` constant with your Sheet ID
6. Create HTML files:
   - Click **+** next to Files > **HTML**
   - Create `AmbulanceStart.html` and paste content from `Website/AmbulanceStart.html`
   - Create `AmbulanceForm.html` and paste content from `Website/AmbulanceForm.html`
   - Create `AmbulanceDashboard.html` and paste content from `Website/AmbulanceDashboard.html`
7. Click **Deploy** > **New deployment**
8. Choose type: **Web app**
9. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
10. Click **Deploy**
11. Copy the **Web app URL** - you'll need this for ESP32

### 3. Deploy Apps Script (Hospital)

1. Create a new Apps Script project (or use a new sheet)
2. Copy content from `Website/hospital.gs`
3. Update the `SHEET_ID` constant (same as ambulance)
4. Create HTML file:
   - Create `HospitalDashboard.html` and paste content from `Website/HospitalDashboard.html`
5. Deploy as Web app (same process as above)

## 💻 Firmware Upload

### Ambulance Unit

1. Open `Firmware/ambulance/ambulance.ino` in Arduino IDE
2. Install all required libraries (see Required Libraries section)
3. Update configuration:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverName = "YOUR_GOOGLE_APPS_SCRIPT_DEPLOYMENT_URL";
   ```
4. Select Board: **ESP32 Dev Module**
5. Select correct COM port
6. Upload the code

### Traffic Unit

1. Open `Firmware/traffic/traffic.ino` in Arduino IDE
2. Install required libraries
3. Select Board: **Arduino Nano**
4. Select Processor: **ATmega328P** or **ATmega328P (Old Bootloader)**
5. Select correct COM port
6. Upload the code

## 📱 How to Use

### For Ambulance Attendant:

1. **Power On**: Turn on the ESP32 unit
2. **Wait for Patient ID**: A unique Patient ID will be displayed on the OLED screen
3. **Open Dashboard**: Navigate to your Ambulance Apps Script Web App URL
4. **Click START**: This will open the data entry form
5. **Select Patient ID**: Choose the Patient ID shown on OLED from dropdown
6. **Fill Form**: Enter all patient details:
   - Patient Name
   - Age
   - Blood Group
   - Patient Status (Normal/Medium/Critical)
   - Blood Pressure
   - Blood Sugar Level
   - Ambulance ID
   - Attender ID
   - Destination Hospital
7. **Submit**: Click submit to save data
8. **View Dashboard**: Auto-redirects to live monitoring dashboard
9. **Monitor**: Dashboard auto-refreshes every 10 seconds with sensor data

### For Hospital Staff:

1. **Open Dashboard**: Navigate to Hospital Apps Script Web App URL
2. **Monitor**: View real-time patient vitals and ambulance location
3. **Video Call**: Click "Start Video Call" to initiate Google Meet call
4. **Mark Arrival**: When ambulance arrives, click "Mark Patient as Arrived"

## 🚦 Traffic Signal Operation

- **Normal Mode**: Traffic lights cycle through directions (15 sec green, 3 sec yellow)
- **Emergency Mode**: When ambulance RF signal detected:
  - Ambulance direction turns GREEN
  - All other directions turn RED
  - Stays in emergency mode for 30 seconds
  - Returns to normal operation after ambulance passes

## 🔍 Database Fields Explained

| Field | Auto/Manual | Description |
|-------|-------------|-------------|
| Date | Auto | Timestamp of data upload |
| Patient Name | Manual | Full name of patient |
| Patient Age | Manual | Age in years |
| Patient Blood Group | Manual | Blood type (A+, B-, etc.) |
| Patient ID | Auto | Unique ID generated by ESP32 |
| Patient Status | Manual | Normal/Medium/Critical |
| Temperature | Auto | Body temperature from sensor |
| Oxygen Level | Auto | SpO2 from pulse oximeter |
| Heart Rate | Auto | BPM from pulse oximeter |
| Blood Pressure | Manual | Systolic/Diastolic |
| Diabetics Level | Manual | Blood sugar in mg/dL |
| Ambulance ID | Manual | Ambulance identification |
| Ambulance Speed | Auto | GPS speed in km/h |
| Ambulance Long | Auto | GPS longitude |
| Ambulance Latti | Auto | GPS latitude |
| Next Traffic Int | Auto | Next traffic intersection |
| Past Traffic Int | Auto | Previous intersection |
| Hospital | Manual | Destination hospital |
| Done | Auto | 1 when patient arrives |

## 🎨 Dashboard Features

### Ambulance Dashboard
- Real-time vital signs display
- Color-coded status indicators (Green=Normal, Yellow=High, Red=Low)
- Patient information card
- Video call button
- Auto-refresh every 10 seconds

### Hospital Dashboard
- All patient vitals from ambulance
- Ambulance location tracking
- Speed and ETA information
- Patient details
- Video call integration
- Mark arrival button
- Live telemetry streaming indicator

## 🔒 Security Notes

- The Google Apps Script should be deployed with "Execute as: Me"
- Set "Who has access" based on your security requirements
- Consider using authentication for production deployments
- WiFi credentials are stored in firmware - protect access to devices

## 🐛 Troubleshooting

### ESP32 Not Connecting to WiFi
- Check SSID and password
- Ensure 2.4GHz WiFi network (ESP32 doesn't support 5GHz)
- Check WiFi signal strength

### Sensor Not Working
- Verify I2C connections (SDA, SCL)
- Check sensor power supply (3.3V)
- Use I2C scanner to detect sensor addresses

### Data Not Uploading to Sheet
- Verify Google Apps Script deployment URL
- Check internet connection
- Ensure Apps Script is deployed as "Anyone" can access
- Check Sheet ID in Apps Script

### NRF24L01 Communication Issues
- Add 10µF capacitor between VCC and GND on NRF24L01
- Use short wires (< 10cm)
- Ensure both devices use same address
- Check power supply (3.3V, not 5V!)

### Dashboard Not Loading
- Clear browser cache
- Check Apps Script deployment status
- Verify HTML files are correctly named
- Check browser console for errors

## 📊 Customization

### Adding More Hospitals
In `AmbulanceForm.html` and traffic unit firmware, add hospitals:
```html
<option value="Hospital 5">Hospital 5</option>
```

### Changing Refresh Rate
In dashboard HTML files, modify:
```javascript
refreshInterval = setInterval(function() {
  loadDashboard();
}, 10000); // Change 10000 to desired milliseconds
```

### Adjusting Vital Status Ranges
In Apps Script files, modify status functions:
```javascript
function getTemperatureStatus(temp) {
  if (temp >= 36.1 && temp <= 37.2) return 'Normal';
  if (temp > 37.2) return 'High';
  return 'Low';
}
```

## 📝 License

This project is open-source and available for educational and non-commercial use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For issues and questions, please create an issue in the repository.

## 🎯 Future Enhancements

- [ ] Mobile app for better accessibility
- [ ] Multiple patient support
- [ ] Advanced GPS routing with traffic integration
- [ ] SMS/Email notifications
- [ ] Historical data analytics
- [ ] Integration with hospital management systems
- [ ] Advanced ECG monitoring
- [ ] Medication tracking

---

**⚠️ IMPORTANT**: This is a prototype system for educational purposes. For actual medical use, ensure compliance with medical device regulations and safety standards in your region.
