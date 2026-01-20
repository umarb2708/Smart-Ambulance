# Quick Setup Guide - Smart Ambulance System

## 📋 Pre-Setup Checklist

- [ ] ESP32 NodeMCU board
- [ ] Arduino Nano board
- [ ] All sensors (MLX90614, MAX30102, GPS)
- [ ] OLED Display
- [ ] 2x NRF24L01 modules
- [ ] WS2812 LED strip (4 LEDs)
- [ ] USB cables for programming
- [ ] Arduino IDE installed
- [ ] Google account

## 🚀 Step-by-Step Setup

### Step 1: Install Arduino IDE & Libraries (15 minutes)

1. **Download Arduino IDE**
   - Visit: https://www.arduino.cc/en/software
   - Install version 2.0 or later

2. **Install ESP32 Board Support**
   - Open Arduino IDE
   - File → Preferences
   - Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager
   - Search "ESP32" → Install "ESP32 by Espressif Systems"

3. **Install Libraries**
   
   Go to **Sketch → Include Library → Manage Libraries**, search and install:
   
   **For ESP32:**
   - Adafruit MLX90614 Library
   - MAX30105 Particle Sensor
   - Adafruit GFX Library
   - Adafruit SSD1306
   - RF24 by TMRh20
   - TinyGPSPlus
   
   **For Arduino Nano:**
   - RF24 by TMRh20
   - Adafruit NeoPixel

### Step 2: Setup Google Sheets (10 minutes)

1. **Create Sheet**
   ```
   - Go to sheets.google.com
   - Create new sheet → Name: "Smart Ambulance Database"
   - Rename Sheet1 to "DataBase" (exact spelling)
   ```

2. **Add Headers**
   Copy-paste this row into A1:
   ```
   Date	Patient Name	Patient Age	Patient Blood Group	Patient ID	Patient Status	Temperature	Oxygen Level	Heart Rate	Blood Pressure	Diabetics Level	Ambulance ID	Ambulance Speed	Ambulance Long	Ambulance Latti	Next Traffic Int	Past Traffic Int	Hospital	Done
   ```

3. **Get Sheet ID**
   - Look at URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the SHEET_ID_HERE part
   - Save it somewhere - you'll need it!

### Step 3: Deploy Ambulance Apps Script (15 minutes)

1. **Open Apps Script**
   - In your Google Sheet: Extensions → Apps Script

2. **Create Code.gs**
   - Delete existing code
   - Copy entire content from `Website/ambulance.gs`
   - Paste into Code.gs
   - **IMPORTANT**: Update line 11:
     ```javascript
     const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
     ```

3. **Create HTML Files**
   - Click **+ next to Files** → HTML
   - Name: `AmbulanceStart`
   - Copy content from `Website/AmbulanceStart.html`
   
   - Repeat for:
     - `AmbulanceForm`
     - `AmbulanceDashboard`

4. **Deploy**
   - Click **Deploy** → **New deployment**
   - Click gear icon → Select **Web app**
   - Settings:
     - Description: "Ambulance Dashboard"
     - Execute as: **Me**
     - Who has access: **Anyone**
   - Click **Deploy**
   - Click **Authorize access** → Choose your account
   - Click **Advanced** → Go to project (unsafe)
   - Click **Allow**
   - **COPY THE WEB APP URL** - Save it!

### Step 4: Deploy Hospital Apps Script (10 minutes)

1. **Create New Apps Script Project**
   - Go to script.google.com
   - New project

2. **Add Code**
   - Copy content from `Website/hospital.gs`
   - Update SHEET_ID (same ID as before)

3. **Create HTML**
   - Add `HospitalDashboard.html`
   - Copy content from `Website/HospitalDashboard.html`

4. **Deploy**
   - Same process as ambulance
   - **COPY THIS WEB APP URL TOO**

### Step 5: Program ESP32 (Ambulance Unit) (10 minutes)

1. **Open Firmware**
   - Open `Firmware/ambulance/ambulance.ino` in Arduino IDE

2. **Update Settings** (Lines 25-30)
   ```cpp
   const char* ssid = "Your_WiFi_Name";
   const char* password = "Your_WiFi_Password";
   const char* serverName = "PASTE_AMBULANCE_WEB_APP_URL_HERE";
   ```

3. **Connect ESP32**
   - Connect via USB
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module
   - Tools → Port → Select your COM port

4. **Upload**
   - Click Upload button
   - Wait for "Done uploading"

### Step 6: Program Arduino Nano (Traffic Unit) (5 minutes)

1. **Open Firmware**
   - Open `Firmware/traffic/traffic.ino`

2. **Connect Arduino Nano**
   - Connect via USB
   - Tools → Board → Arduino AVR Boards → Arduino Nano
   - Tools → Processor → ATmega328P (or Old Bootloader)
   - Tools → Port → Select COM port

3. **Upload**
   - Click Upload
   - Wait for completion

### Step 7: Wire Connections

#### ESP32 Connections

```
MLX90614 (Temperature):
  VCC → 3.3V
  GND → GND
  SDA → GPIO 21
  SCL → GPIO 22

MAX30102 (Pulse Ox):
  VCC → 3.3V
  GND → GND
  SDA → GPIO 21
  SCL → GPIO 22

OLED Display:
  VCC → 3.3V
  GND → GND
  SDA → GPIO 21
  SCL → GPIO 22

NRF24L01:
  VCC → 3.3V (Add 10µF capacitor!)
  GND → GND
  CE → GPIO 4
  CSN → GPIO 5
  MISO → GPIO 19
  MOSI → GPIO 23
  SCK → GPIO 18

GPS Module:
  VCC → 5V
  GND → GND
  TX → GPIO 16
  RX → GPIO 17
```

**⚠️ CRITICAL**: Add a 10µF capacitor between VCC and GND on NRF24L01!

#### Arduino Nano Connections

```
NRF24L01:
  VCC → 3.3V (Add 10µF capacitor!)
  GND → GND
  CE → Pin 9
  CSN → Pin 10
  MISO → Pin 12
  MOSI → Pin 11
  SCK → Pin 13

WS2812 LED Strip:
  VCC → 5V
  GND → GND
  DIN → Pin 6
```

### Step 8: Testing (10 minutes)

#### Test ESP32:
1. Power on ESP32
2. Watch Serial Monitor (115200 baud)
3. Should see:
   - "WiFi Connected"
   - "System Ready"
   - Patient ID displayed on OLED

#### Test Traffic Unit:
1. Power on Arduino Nano
2. Serial Monitor (9600 baud)
3. Should see: "Traffic Signal Ready"
4. LEDs should cycle through colors

#### Test Dashboard:
1. Open Ambulance Web App URL in browser
2. Click "START EMERGENCY MODE"
3. Select Patient ID (from OLED)
4. Fill form and submit
5. Should redirect to dashboard
6. Data should update every 10 seconds

#### Test Hospital Dashboard:
1. Open Hospital Web App URL
2. Should show patient data
3. Should auto-refresh every 10 seconds

## ✅ Verification Checklist

After setup, verify:

- [ ] ESP32 connects to WiFi
- [ ] OLED shows Patient ID
- [ ] Sensors show readings in Serial Monitor
- [ ] Data appears in Google Sheet
- [ ] Ambulance dashboard loads and shows data
- [ ] Hospital dashboard loads and shows data
- [ ] Auto-refresh works (watch timestamp change)
- [ ] Traffic lights cycle normally
- [ ] NRF communication works (check Serial Monitors)

## 🔧 Common Issues & Fixes

### ESP32 Won't Upload
- Hold BOOT button while uploading
- Try different USB cable
- Reduce upload speed: Tools → Upload Speed → 115200

### NRF24L01 Not Working
- **MUST add 10µF capacitor** between VCC and GND
- Use shortest wires possible (< 10cm)
- Both modules must be on 3.3V, NOT 5V
- Check if modules are on same channel

### Dashboard Shows Old Data
- Refresh browser (Ctrl+F5)
- Clear browser cache
- Check if ESP32 is connected to WiFi
- Verify Sheet ID in Apps Script

### Sensors Show 0 or Wrong Values
- Check I2C connections
- All I2C devices share same SDA/SCL
- Verify sensor power (3.3V)
- Run I2C scanner sketch to find addresses

### "Patient ID Not Found" Error
- Patient ID on OLED must match dropdown selection
- ESP32 must upload data first (wait 10 seconds after power on)
- Check Google Sheet for Patient ID column

## 📱 Usage Workflow

1. **Start Emergency**
   - Attendant powers on ESP32
   - Patient ID appears on OLED
   
2. **Enter Data**
   - Open ambulance dashboard on phone/tablet
   - Click START
   - Select Patient ID from dropdown
   - Fill patient details
   - Submit
   
3. **Monitor in Transit**
   - Ambulance dashboard shows live vitals
   - Hospital receives real-time data
   - Traffic signals automatically controlled
   
4. **Arrive at Hospital**
   - Hospital staff clicks "Mark Patient as Arrived"
   - Patient record marked as complete
   - System ready for next patient

## 📞 Quick Reference

**Default Baud Rates:**
- ESP32 Serial: 115200
- Arduino Nano Serial: 9600
- GPS: 9600

**I2C Addresses:**
- OLED: 0x3C
- MLX90614: 0x5A (default)
- MAX30102: 0x57 (default)

**Refresh Rates:**
- ESP32 uploads: Every 10 seconds
- Dashboard refresh: Every 10 seconds
- Traffic signal normal cycle: 15 seconds green + 3 seconds yellow

**Power Requirements:**
- ESP32: 5V via USB or VIN
- Arduino Nano: 5V via USB or VIN
- All sensors: 3.3V
- WS2812 LEDs: 5V

## 🎓 Tips for Success

1. **Test Each Component Separately**
   - Upload basic sensor test sketches first
   - Verify each sensor works before combining
   
2. **Use Serial Monitor**
   - Keep it open during testing
   - Watch for error messages
   
3. **Check Connections Twice**
   - Use multimeter to verify voltages
   - Ensure no loose wires
   
4. **Start Simple**
   - Get WiFi working first
   - Then add sensors one by one
   
5. **Document Your Setup**
   - Take photos of wiring
   - Note which COM ports you use
   - Save all URLs and IDs

## 📚 Next Steps

Once everything works:

1. Test with realistic patient scenarios
2. Train users on the interface
3. Create backup power solutions
4. Consider weatherproofing for outdoor use
5. Add authentication for security
6. Expand hospital list
7. Test RF range in real environment

---

**Need Help?** Check the main README.md for detailed troubleshooting!
