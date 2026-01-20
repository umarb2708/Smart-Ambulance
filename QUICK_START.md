# Quick Start Checklist - Smart Ambulance System

## ⚡ 30-Minute Quick Start (If You Have All Components)

### ☑️ Pre-Flight Check
- [ ] All hardware components ready
- [ ] Arduino IDE installed with ESP32 support
- [ ] Google account ready
- [ ] WiFi network available (2.4GHz)

---

## 🔥 STEP 1: Google Sheets Setup (5 minutes)

1. **Create Sheet**
   - [ ] Go to sheets.google.com
   - [ ] New sheet → Name: "Smart Ambulance Database"
   - [ ] Rename Sheet1 to "DataBase"

2. **Add Headers** (Copy-paste into row 1, cell A1):
   ```
   Date	Patient Name	Patient Age	Patient Blood Group	Patient ID	Patient Status	Temperature	Oxygen Level	Heart Rate	Blood Pressure	Diabetics Level	Ambulance ID	Ambulance Speed	Ambulance Long	Ambulance Latti	Next Traffic Int	Past Traffic Int	Hospital	Done
   ```

3. **Get Sheet ID**
   - [ ] URL: `docs.google.com/spreadsheets/d/COPY_THIS_PART/edit`
   - [ ] Save Sheet ID: `_________________`

---

## 🔥 STEP 2: Deploy Ambulance Apps Script (7 minutes)

1. **Open Apps Script**
   - [ ] In Sheet: Extensions → Apps Script

2. **Paste Code**
   - [ ] Copy all from `Website/ambulance.gs`
   - [ ] Paste into Code.gs
   - [ ] Line 11: Update SHEET_ID with your ID

3. **Add HTML Files**
   - [ ] ➕ next to Files → HTML → Name: `AmbulanceStart`
   - [ ] Copy content from `Website/AmbulanceStart.html`
   - [ ] Repeat for `AmbulanceForm` and `AmbulanceDashboard`

4. **Deploy**
   - [ ] Deploy → New deployment → Web app
   - [ ] Execute as: Me
   - [ ] Who has access: Anyone
   - [ ] Authorize → Allow all permissions
   - [ ] **Copy Web App URL**: `_________________`

---

## 🔥 STEP 3: Deploy Hospital Apps Script (5 minutes)

1. **New Script**
   - [ ] Go to script.google.com → New project

2. **Add Code**
   - [ ] Copy from `Website/hospital.gs`
   - [ ] Update SHEET_ID (same as before)

3. **Add HTML**
   - [ ] Add `HospitalDashboard.html`
   - [ ] Copy content from `Website/HospitalDashboard.html`

4. **Deploy**
   - [ ] Deploy → New deployment → Web app
   - [ ] Same settings as ambulance
   - [ ] **Copy Web App URL**: `_________________`

---

## 🔥 STEP 4: Upload ESP32 Code (5 minutes)

1. **Install Libraries**
   - [ ] Sketch → Include Library → Manage Libraries
   - [ ] Install: Adafruit MLX90614, MAX30105, Adafruit GFX, Adafruit SSD1306, RF24, TinyGPSPlus

2. **Update Code**
   - [ ] Open `Firmware/ambulance/ambulance.ino`
   - [ ] Line 26: WiFi SSID: `_________________`
   - [ ] Line 27: WiFi Password: `_________________`
   - [ ] Line 30: Paste Ambulance Web App URL

3. **Upload**
   - [ ] Connect ESP32
   - [ ] Tools → Board → ESP32 Dev Module
   - [ ] Tools → Port → Select your port
   - [ ] Click Upload ⬆️

---

## 🔥 STEP 5: Upload Arduino Nano Code (3 minutes)

1. **Install Libraries**
   - [ ] Install: RF24, Adafruit NeoPixel

2. **Upload**
   - [ ] Open `Firmware/traffic/traffic.ino`
   - [ ] Connect Arduino Nano
   - [ ] Tools → Board → Arduino Nano
   - [ ] Tools → Processor → ATmega328P (try Old Bootloader if fails)
   - [ ] Click Upload ⬆️

---

## 🔥 STEP 6: Wire Everything (10 minutes)

### ESP32 Connections
```
MLX90614:  VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22
MAX30102:  VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22
OLED:      VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22
NRF24L01:  VCC→3.3V [+10µF CAP!], GND→GND, CE→GPIO4, CSN→GPIO5,
           MOSI→GPIO23, MISO→GPIO19, SCK→GPIO18
GPS:       VCC→5V, GND→GND, TX→GPIO16, RX→GPIO17
```

**CRITICAL**: 
- [ ] ⚠️ Solder 10µF capacitor on NRF24L01 VCC & GND
- [ ] ⚠️ All I2C devices share SDA/SCL
- [ ] ⚠️ Common GND for everything

### Arduino Nano Connections
```
NRF24L01:  VCC→3.3V [+10µF CAP!], GND→GND, CE→Pin9, CSN→Pin10,
           MOSI→Pin11, MISO→Pin12, SCK→Pin13
WS2812:    VCC→5V, GND→GND, DIN→Pin6
```

---

## 🔥 STEP 7: Test! (5 minutes)

### Test ESP32
1. **Power On**
   - [ ] Serial Monitor: 115200 baud
   - [ ] Should see "WiFi Connected"
   - [ ] Should see "System Ready"
   - [ ] OLED shows Patient ID

2. **Check Google Sheet**
   - [ ] Wait 10 seconds
   - [ ] New row should appear with Patient ID

### Test Dashboard
1. **Open Ambulance URL** (from Step 2)
   - [ ] Should see START button
   - [ ] Click START
   - [ ] Form should load
   - [ ] Dropdown should have Patient ID

2. **Fill Form**
   - [ ] Select Patient ID from OLED
   - [ ] Fill all fields
   - [ ] Submit
   - [ ] Should redirect to dashboard
   - [ ] Dashboard shows data

3. **Open Hospital URL** (from Step 3)
   - [ ] Should load patient data
   - [ ] Should see same Patient ID
   - [ ] Should auto-refresh

### Test Traffic Unit
1. **Arduino Serial Monitor**: 9600 baud
   - [ ] Should see "Traffic Signal Ready"
   - [ ] LEDs should cycle (red/yellow/green)

2. **Trigger Emergency**
   - [ ] Fill hospital field in form
   - [ ] Watch Arduino Serial Monitor
   - [ ] Should see "Received: AMB..." message
   - [ ] LED should turn green for that direction

---

## ✅ Success Criteria

Your system is working if:
- [x] ESP32 connects to WiFi automatically
- [x] OLED displays Patient ID
- [x] Google Sheet gets new rows every 10 seconds
- [x] Dashboard loads and shows live data
- [x] Dashboard auto-refreshes (watch timestamp)
- [x] Hospital dashboard shows same data
- [x] Traffic LEDs cycle normally
- [x] Traffic LEDs respond to ambulance (green for direction)

---

## 🚨 Quick Fixes

**ESP32 won't upload?**
- Hold BOOT button during upload

**WiFi won't connect?**
- Check SSID/password (case sensitive!)
- Make sure it's 2.4GHz network

**Dashboard shows "--"?**
- Wait 10 seconds for first data
- Check Sheet ID in Apps Script
- Refresh browser (Ctrl+F5)

**NRF not working?**
- Add 10µF capacitor (MUST HAVE!)
- Use short wires (< 10cm)
- Both on 3.3V, not 5V

**Sensors read 0?**
- Check I2C connections (SDA/SCL)
- Verify 3.3V power to sensors
- Make sure GNDs connected

---

## 📱 Bookmark These URLs

**Save these for daily use:**

📋 Google Sheet:  
`_________________`

🚑 Ambulance Dashboard:  
`_________________`

🏥 Hospital Dashboard:  
`_________________`

---

## 🎯 Next Steps After Basic Test

1. **Fine-tune sensors**
   - Test heart rate with finger on sensor
   - Verify temperature readings
   - GPS test outdoors

2. **Test RF range**
   - Move devices apart
   - Find maximum working distance

3. **Train users**
   - Show attendants the form
   - Show hospital staff the dashboard

4. **Customize**
   - Add more hospitals
   - Adjust refresh rates
   - Tweak vital thresholds

---

## 📚 Documentation

Refer to these files for details:

- **Setup issues?** → `SETUP_GUIDE.md`
- **Wiring help?** → `WIRING_DIAGRAMS.md`
- **Not working?** → `TROUBLESHOOTING.md`
- **Library errors?** → `LIBRARY_INSTALLATION.md`
- **Full details?** → `README.md`

---

## ⏱️ Time Breakdown

| Task | Time |
|------|------|
| Google Sheets setup | 5 min |
| Ambulance Apps Script | 7 min |
| Hospital Apps Script | 5 min |
| ESP32 code upload | 5 min |
| Arduino code upload | 3 min |
| Hardware wiring | 10 min |
| Testing | 5 min |
| **TOTAL** | **40 min** |

*(Assumes all libraries pre-installed and components ready)*

---

## 🎉 You're Done!

When all checkboxes are ticked, your Smart Ambulance System is **LIVE**! 🚑

**Test it end-to-end:**
1. Power on ESP32 → See Patient ID on OLED
2. Open ambulance dashboard → Enter patient data
3. Watch hospital dashboard → See live updates
4. Monitor traffic unit → See emergency mode activate

**Congratulations! You've built an IoT emergency response system!**

---

**Need Help?** Check TROUBLESHOOTING.md or review Serial Monitor output!
