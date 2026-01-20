# Troubleshooting Guide - Smart Ambulance System

## 🔍 General Debugging Steps

1. **Always check Serial Monitor first** - Most issues show up here
2. **Test one component at a time** - Don't connect everything at once
3. **Verify power** - Use multimeter to check voltages
4. **Check connections** - Loose wires are the #1 cause of problems
5. **Read error messages carefully** - They usually tell you exactly what's wrong

---

## 📡 ESP32 Issues

### ESP32 Won't Upload Code

**Symptoms**: Upload fails, "Failed to connect" error

**Solutions**:
1. **Hold BOOT button** during upload (some boards require this)
2. **Try different USB cable** - Data cables only, not charging cables
3. **Check COM port**: Tools → Port → Select correct port
4. **Lower baud rate**: Tools → Upload Speed → 115200
5. **Install CH340 driver** if using CH340 chip version
6. **Try different USB port**
7. **Reset sequence**: Hold BOOT → Press RESET → Release RESET → Release BOOT → Click Upload

**Still not working?**
- Check if LED blinks during upload attempt
- Try uploading a blank sketch
- Board might be bricked - may need flash tool recovery

### ESP32 Won't Connect to WiFi

**Symptoms**: "WiFi Failed" on OLED, stuck at connecting

**Solutions**:
1. **Check SSID/Password** - Case sensitive!
2. **2.4GHz only** - ESP32 doesn't support 5GHz WiFi
3. **WiFi signal strength** - Move router closer or use WiFi extender
4. **Special characters** - Avoid special chars in WiFi name/password
5. **Router settings**:
   - Enable 2.4GHz band
   - Disable AP isolation
   - Check MAC filtering (whitelist ESP32)
6. **Try mobile hotspot** - To test if it's router issue

**Test Code**:
```cpp
WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED) {
  delay(500);
  Serial.print(".");
  Serial.println(WiFi.status()); // Print status code
}
```

Status codes:
- 0 = WL_IDLE_STATUS
- 1 = WL_NO_SSID_AVAIL (wrong SSID)
- 3 = WL_CONNECTED
- 4 = WL_CONNECT_FAILED (wrong password)
- 6 = WL_DISCONNECTED

### ESP32 Reboots Randomly

**Symptoms**: Device restarts, "brownout detector" in Serial

**Solutions**:
1. **Power supply issue** - Use good quality 5V/1A+ power
2. **NRF24L01 power draw** - ADD 10µF CAPACITOR (critical!)
3. **USB cable** - Poor quality cables cause voltage drops
4. **Remove devices one by one** - Find which causes restart
5. **Don't power multiple 3.3V devices** - Use external regulator
6. **Check GND connections** - All GNDs must be connected

### Data Not Uploading to Google Sheets

**Symptoms**: No data in sheet, timeout errors

**Solutions**:
1. **Check Web App URL** - Must include https://
2. **Verify SHEET_ID** in Apps Script
3. **Apps Script deployment**:
   - Must be deployed as "Web app"
   - Execute as: Me
   - Who has access: Anyone
4. **Check internet** - ESP32 must be online
5. **Test URL** - Open in browser, should not error
6. **Serial Monitor** - Look for HTTP response code
   - 200 = OK
   - 302 = Redirect (deployment issue)
   - 401/403 = Permission denied
   - 404 = Wrong URL

**Test connectivity**:
```cpp
HTTPClient http;
http.begin("http://www.google.com");
int code = http.GET();
Serial.println(code); // Should be 301 or 200
```

---

## 🌡️ Sensor Issues

### MLX90614 Temperature Sensor Not Working

**Symptoms**: Always reads 0, won't initialize

**Solutions**:
1. **Check I2C address**: Use I2C scanner sketch
2. **Verify connections**:
   - VCC to 3.3V (NOT 5V)
   - GND to GND
   - SDA to GPIO 21
   - SCL to GPIO 22
3. **Pull-up resistors** - Some need 4.7kΩ on SDA/SCL
4. **Swap SDA/SCL** - Easy to mix up
5. **Test with example sketch**:
   File → Examples → Adafruit MLX90614 → mlxtest

**I2C Scanner Sketch**:
```cpp
#include <Wire.h>
void setup() {
  Wire.begin();
  Serial.begin(115200);
  Serial.println("I2C Scanner");
}
void loop() {
  for(byte i = 8; i < 120; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found I2C device at 0x");
      Serial.println(i, HEX);
    }
  }
  delay(5000);
}
```

### MAX30102 Heart Rate Sensor Issues

**Symptoms**: No readings, always 0, no finger detection

**Solutions**:
1. **Finger placement** - Must cover sensor completely
2. **Pressure** - Press firmly but not too hard
3. **Clean sensor** - Dirty sensor = poor readings
4. **Ambient light** - Cover sensor from bright light
5. **Initialize properly**:
   ```cpp
   particleSensor.setup();
   particleSensor.setPulseAmplitudeRed(0x0A);
   ```
6. **Check IR value** - Should be > 50000 with finger
7. **LED settings** - Increase pulse amplitude if too dim
8. **Stay still** - Movement causes bad readings

**Quick Test**:
```cpp
long irValue = particleSensor.getIR();
Serial.println(irValue);
// Should be > 50000 with finger on sensor
```

### GPS Module Not Working

**Symptoms**: No location, lat/long always 0

**Solutions**:
1. **Outdoor test required** - GPS doesn't work indoors well
2. **Clear sky view** - Needs to see satellites
3. **Wait time** - Cold start takes 1-5 minutes
4. **Verify RX/TX**:
   - GPS TX → ESP32 RX (GPIO 16)
   - GPS RX → ESP32 TX (GPIO 17)
5. **Baud rate** - GPS usually 9600
6. **Check NMEA sentences**:
   ```cpp
   while (gpsSerial.available()) {
     Serial.write(gpsSerial.read());
   }
   // Should see $GPGGA, $GPRMC sentences
   ```
7. **LED indicator** - Most GPS have LED (blinking = searching, solid = locked)

### OLED Display Issues

**Symptoms**: Blank screen, no text, garbled display

**Solutions**:
1. **Check address** - Usually 0x3C or 0x3D
2. **Verify size** - Code must match display (128x64 vs 128x32)
3. **display.begin()** - Must return true
4. **display.display()** - Must call after drawing
5. **Contrast** - Try adjusting:
   ```cpp
   display.setContrast(255);
   ```
6. **Test with simple code**:
   ```cpp
   display.clearDisplay();
   display.setCursor(0,0);
   display.println("TEST");
   display.display();
   ```
7. **Power** - Needs stable 3.3V or 5V (check datasheet)

---

## 📻 NRF24L01 Communication Issues

### NRF24L01 Won't Communicate

**Symptoms**: No data received, "transmission failed"

**Solutions**:

**CRITICAL - MUST DO:**
1. **Add 10µF capacitor** between VCC and GND on BOTH modules
   - Solder as close to module as possible
   - THIS IS THE #1 FIX!

**Wiring:**
2. **Use SHORT wires** - Maximum 10cm, preferably 5cm
3. **Twisted pair for VCC/GND**
4. **Check connections**:
   - VCC to 3.3V (NOT 5V - will damage module!)
   - All GND connected
5. **SPI pins correct**:
   - MOSI, MISO, SCK - standard SPI pins
   - CE, CSN - to defined GPIO pins

**Code:**
6. **Same address** on both devices
7. **Same channel** - default is 76
8. **Match data size**:
   ```cpp
   // Transmitter
   char msg[32] = "test";
   radio.write(&msg, sizeof(msg));
   
   // Receiver
   char msg[32] = "";
   radio.read(&msg, sizeof(msg));
   ```
9. **One transmitter, one receiver**:
   - Ambulance: `radio.stopListening()` (transmit)
   - Traffic: `radio.startListening()` (receive)

**Testing:**
10. **Test with example sketches first**:
    - File → Examples → RF24 → GettingStarted
    - Upload to both devices
    - Follow serial prompts

**Power:**
11. **Separate power supply** - NRF draws lots of current
12. **Check voltage** - Must be 3.0V - 3.6V (NOT 5V!)

**Physical:**
13. **Antenna** - If module has antenna, ensure it's attached
14. **PA+LNA modules** - Need more power, use 3.3V regulator
15. **Distance** - Start with devices 1 meter apart

**Advanced:**
```cpp
// Check module connected
if (!radio.begin()) {
  Serial.println("NRF not found!");
}

// Print config
radio.printDetails();
```

---

## 🚦 Arduino Nano / Traffic Signal Issues

### Arduino Nano Upload Fails

**Symptoms**: avrdude errors, not in sync

**Solutions**:
1. **Select correct processor**:
   - Try: ATmega328P
   - If fails, try: ATmega328P (Old Bootloader)
2. **Check COM port**
3. **Install CH340 driver** if needed
4. **Disconnect other devices** during upload
5. **Try slower baud**: Tools → Upload Speed → 57600

### WS2812 LEDs Not Working

**Symptoms**: LEDs don't light, wrong colors, flickering

**Solutions**:
1. **Check power**:
   - WS2812 needs 5V
   - Each LED draws ~60mA max
   - 4 LEDs = max 240mA
2. **Data pin** - Correct pin (Pin 6 in code)
3. **LED order** - DIN → DOUT (follow arrows)
4. **First LED damaged** - Try cutting first LED off
5. **Level shifter** - 3.3V logic to 5V LEDs (may need)
6. **Code settings**:
   ```cpp
   #define NUM_LEDS 4
   #define LED_PIN 6
   Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
   ```
7. **Color order** - Try NEO_RGB if NEO_GRB wrong
8. **Capacitor** - 1000µF across power supply
9. **Resistor** - 470Ω on data line (recommended)

**Test Code**:
```cpp
strip.setPixelColor(0, strip.Color(255, 0, 0)); // Red
strip.show();
```

### Traffic Lights Not Responding to Ambulance

**Symptoms**: Stays in normal mode, doesn't go green

**Solutions**:
1. **Check NRF communication** - See NRF section above
2. **Serial Monitor** - Should see "Received: ..." message
3. **Message format** - Must match:
   ```cpp
   "AMB-MUM-1024|Hospital 1|EMERGENCY|54"
   ```
4. **Hospital mapping** - Check hospital names match in code
5. **Test manually**:
   ```cpp
   // In traffic.ino loop()
   processEmergencySignal("AMB-TEST|Hospital 1|EMERGENCY|50");
   ```

---

## 🌐 Google Apps Script Issues

### Dashboard Won't Load

**Symptoms**: Blank page, "Authorization required", errors

**Solutions**:
1. **Re-deploy**:
   - Deploy → Manage deployments
   - Click edit (pencil icon)
   - Version: New version
   - Deploy
   - Use NEW url
2. **Authorization**:
   - May need to re-authorize
   - Click "Advanced" → Go to project
   - Allow permissions
3. **Clear browser cache** - Ctrl+Shift+Del
4. **Try incognito mode**
5. **Check deployment settings**:
   - Execute as: Me
   - Who has access: Anyone
6. **Script editor errors**:
   - Check for syntax errors
   - View → Executions (check for errors)

### Data Not Showing on Dashboard

**Symptoms**: Dashboard loads but shows "--" or old data

**Solutions**:
1. **Check Sheet ID** - Must match in both .gs files
2. **Sheet name** - Must be "DataBase" (exact)
3. **Patient ID exists** - Check Google Sheet
4. **Done column** - Make sure not = 1
5. **Browser console** - F12, look for errors
6. **Manual test**:
   - Open Sheet
   - Manually add patient row
   - Refresh dashboard
7. **Auto-refresh** - Wait 10 seconds for update

### Form Submission Fails

**Symptoms**: "Patient ID not found", submission errors

**Solutions**:
1. **Patient ID** - Must exist in sheet first
   - ESP32 creates it on first upload
   - Wait 10 sec after ESP32 power on
2. **Dropdown empty** - ESP32 hasn't uploaded yet
3. **All fields required** - Fill everything
4. **Sheet permissions** - Script must have edit access
5. **Test function directly**:
   ```javascript
   // In Apps Script
   function testSubmit() {
     var result = submitManualData({
       patientID: "AMB-2026-12345",
       patientName: "Test Patient"
       // ... other fields
     });
     Logger.log(result);
   }
   ```

---

## ⚡ Power Issues

### Device Keeps Resetting

**Symptoms**: Random reboots, "brownout detector"

**Solutions**:
1. **Better power supply** - Use 2A rated USB adapter
2. **Capacitors**:
   - 10µF on NRF24L01 (critical!)
   - 100µF on ESP32 VCC
   - 1000µF on WS2812 power
3. **Separate power rails** - Don't power all from ESP32
4. **Thick power wires** - 22 AWG or thicker
5. **Short power runs** - Minimize wire length
6. **Common ground** - All GNDs connected

### Voltage Drop Issues

**Symptoms**: 3.3V measures lower, devices unstable

**Solutions**:
1. **Use external regulator** - AMS1117-3.3V
2. **Bypass capacitors** - 10µF and 0.1µF
3. **Check wire gauge** - Use thicker wires
4. **Shorten wires** - Less resistance
5. **Multiple ground points** - Star grounding
6. **Measure at device** - Not at source

---

## 🔧 Hardware Issues

### Loose Connections

**Prevention**:
1. **Solder connections** - Don't rely on breadboard for final
2. **Use connectors** - JST, Dupont for removable connections
3. **Strain relief** - Secure wires near connectors
4. **Hot glue** - After testing, for permanent mounting
5. **Label wires** - Know what goes where

### Component Damage

**How to tell if damaged**:
1. **Visual** - Burn marks, melted plastic
2. **Heat** - Component gets very hot
3. **Smell** - Burning electronics smell
4. **Multimeter** - Check continuity, resistance
5. **Replacement test** - Swap with known good component

**Common damage causes**:
- 5V to 3.3V components (instant death)
- Reverse polarity (check diode marking)
- Static electricity (use anti-static precautions)
- Short circuit (check for solder bridges)

---

## 📊 Data Issues

### Wrong Sensor Values

**Temperature always 25°C**:
- Not reading sensor, reading itself
- Check sensor initialization

**Heart rate stuck at 0**:
- No finger detected
- Clean sensor surface

**All values are 0**:
- Sensor not initialized
- Check Serial Monitor for init errors

**Values too high/low**:
- Calibration needed
- Check sensor orientation
- Verify sensor type (DHT11 vs DHT22, etc.)

### Google Sheet Formatting

**Date column shows numbers**:
- Format → Number → Date time

**Values not updating**:
- Check Last modified time of sheet
- Verify ESP32 is online and uploading

**Multiple rows for same patient**:
- Patient ID matching issue
- Check for spaces in Patient ID

---

## 🆘 Emergency Fixes

### Quick Diagnostic Checklist

Power issues:
- [ ] Check all VCC connections = 3.3V or 5V (measure!)
- [ ] Check all GND connections are common
- [ ] Add capacitors on NRF24L01
- [ ] Use good quality USB power (2A)

Communication issues:
- [ ] WiFi SSID/password correct
- [ ] NRF24L01 has capacitor
- [ ] Short wires on NRF24L01
- [ ] Same address on both NRF modules

Sensor issues:
- [ ] I2C scanner finds all I2C devices
- [ ] Test each sensor with example sketch
- [ ] Check SDA/SCL not swapped
- [ ] Verify 3.3V power to sensors

Software issues:
- [ ] Libraries all installed
- [ ] Correct board selected
- [ ] Serial Monitor shows initialization
- [ ] Google Sheet ID correct
- [ ] Apps Script deployed properly

---

## 📞 Getting Help

If you're still stuck:

1. **Document the problem**:
   - What were you doing?
   - What did you expect?
   - What actually happened?
   - Error messages (exact text)
   
2. **Gather information**:
   - Serial Monitor output
   - Photos of wiring
   - Code snippets
   - Component part numbers
   
3. **Search first**:
   - Google the exact error message
   - Check library GitHub issues
   - Arduino forums

4. **Test systematically**:
   - Isolate the problem
   - Test one thing at a time
   - Replace components to identify bad ones

---

**Remember**: 90% of hardware problems are loose wires or power issues. Always check these first!
