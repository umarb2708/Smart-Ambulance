# Smart Ambulance System

A comprehensive IoT-based emergency response system that integrates smart traffic control, real-time patient monitoring, and cloud-connected healthcare communication.

## 🚑 Project Overview

This project consists of three main units:

1. **Ambulance Unit**: Hardware sensors + Web dashboard for patient monitoring
2. **Traffic Unit**: Automated traffic signal control for ambulance priority
3. **Hospital Unit**: Real-time monitoring dashboard at the hospital

## 📋 Features

- ✅ Real-time vital signs monitoring (temperature, heart rate, SpO2, BP, blood sugar)
- ✅ Automatic traffic signal control using RF communication
- ✅ Live data transmission to Google Sheets
- ✅ GPS tracking of ambulance location
- ✅ Web-based dashboards with auto-refresh
- ✅ Video call integration with Google Meet
- ✅ Patient data management system

## 🔧 Hardware Requirements

### Ambulance Unit
- ESP32 NodeMCU
- MLX90614ESF Infrared IR Temperature Sensor
- MAX30102 Pulse Oximeter Heart Rate Sensor
- 0.96" OLED Display Module (SPI/I2C)
- NRF24L01 Ultra Low Power 2.4GHz RF Wireless Transceiver
- GPS Module (NEO-6M or similar)
- Connecting wires and breadboard

### Traffic Unit
- Arduino Nano R3 Compatible Board (CH340 Chip)
- NRF24L01 Ultra Low Power 2.4GHz RF Wireless Transceiver
- WS2812 RGB LED Strip (4 LEDs for 4-way traffic light)
- 5V Power supply
- Connecting wires

## 📦 Required Arduino Libraries

### For Ambulance Unit (ESP32)
```
- Adafruit_MLX90614 (Temperature sensor)
- MAX30105 (Pulse oximeter)
- heartRate (Heart rate calculation)
- Adafruit_GFX (Display graphics)
- Adafruit_SSD1306 (OLED display)
- RF24 (NRF24L01 communication)
- WiFi (Built-in ESP32)
- HTTPClient (Built-in ESP32)
- TinyGPS++ (GPS parsing)
```

### For Traffic Unit (Arduino Nano)
```
- RF24 (NRF24L01 communication)
- Adafruit_NeoPixel (WS2812 LED control)
```

## 🔌 Hardware Connections

### Ambulance Unit (ESP32)

**I2C Devices:**
- SDA: GPIO 21
- SCL: GPIO 22
- OLED Display: 0x3C address
- MLX90614: Default I2C address
- MAX30102: Default I2C address

**NRF24L01 (SPI):**
- CE: GPIO 4
- CSN: GPIO 5
- MISO: GPIO 19
- MOSI: GPIO 23
- SCK: GPIO 18

**GPS Module:**
- RX: GPIO 16
- TX: GPIO 17

### Traffic Unit (Arduino Nano)

**NRF24L01:**
- CE: Pin 9
- CSN: Pin 10
- MOSI: Pin 11
- MISO: Pin 12
- SCK: Pin 13

**WS2812 LED:**
- Data: Pin 6

## ☁️ Google Sheets Setup

### 1. Create Google Sheet

1. Create a new Google Sheet
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
