# Library Installation Guide

## ESP32 Libraries Installation

### Method 1: Arduino Library Manager (Recommended)

1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search for each library and click **Install**

### Required Libraries List

#### 1. Adafruit MLX90614 Library
- **Search**: "Adafruit MLX90614"
- **Author**: Adafruit
- **Purpose**: IR temperature sensor
- **Dependencies**: Will auto-install Adafruit BusIO

#### 2. MAX30105 Particle Sensor
- **Search**: "MAX30105"
- **Author**: SparkFun Electronics
- **Purpose**: Pulse oximeter and heart rate sensor
- **Note**: Also installs heartRate library

#### 3. Adafruit GFX Library
- **Search**: "Adafruit GFX"
- **Author**: Adafruit
- **Purpose**: Graphics library for displays

#### 4. Adafruit SSD1306
- **Search**: "Adafruit SSD1306"
- **Author**: Adafruit
- **Purpose**: OLED display driver
- **Dependencies**: Requires Adafruit GFX (install first)

#### 5. RF24
- **Search**: "RF24"
- **Author**: TMRh20
- **Purpose**: NRF24L01 wireless communication
- **Version**: Latest stable version

#### 6. TinyGPSPlus
- **Search**: "TinyGPSPlus"
- **Author**: Mikal Hart
- **Purpose**: GPS data parsing

### Built-in Libraries (No Installation Needed)
These come with ESP32 board support:
- Wire (I2C communication)
- SPI (SPI communication)
- WiFi (WiFi connectivity)
- HTTPClient (HTTP requests)

---

## Arduino Nano Libraries Installation

### Required Libraries

#### 1. RF24
- **Search**: "RF24"
- **Author**: TMRh20
- **Same as ESP32 installation**

#### 2. Adafruit NeoPixel
- **Search**: "Adafruit NeoPixel"
- **Author**: Adafruit
- **Purpose**: WS2812 LED control

### Built-in Libraries (No Installation Needed)
- SPI (SPI communication)

---

## Verification

### Test ESP32 Libraries

Create a new sketch and try to compile this:

```cpp
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

void setup() {
  Serial.begin(115200);
  Serial.println("All libraries loaded successfully!");
}

void loop() {
}
```

If it compiles without errors, all libraries are installed!

### Test Arduino Nano Libraries

```cpp
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <Adafruit_NeoPixel.h>

void setup() {
  Serial.begin(9600);
  Serial.println("All libraries loaded successfully!");
}

void loop() {
}
```

---

## Troubleshooting Library Installation

### Issue: Library Not Found
**Solution**: 
- Update Library Index: Tools → Manage Libraries → Update
- Restart Arduino IDE
- Try manual installation (see below)

### Issue: Compilation Errors After Install
**Solution**:
- Verify correct board selected (ESP32 Dev Module or Arduino Nano)
- Check library version (try stable version, not latest)
- Close and reopen Arduino IDE

### Issue: Multiple Library Versions
**Solution**:
- Go to library folder location
- Delete old versions
- Keep only latest version

### Issue: ESP32 Board Not Available
**Solution**:
1. File → Preferences
2. Additional Board Manager URLs: 
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Tools → Board → Boards Manager
4. Search "ESP32"
5. Install "esp32 by Espressif Systems"

---

## Manual Library Installation (If Library Manager Fails)

### Method 1: ZIP File

1. Download library ZIP from GitHub
2. Arduino IDE: Sketch → Include Library → Add .ZIP Library
3. Select downloaded ZIP file
4. Restart Arduino IDE

### Method 2: Manual Copy

1. Download library from GitHub
2. Extract ZIP file
3. Copy folder to Arduino libraries directory:
   - **Windows**: `C:\Users\[YourName]\Documents\Arduino\libraries\`
   - **Mac**: `~/Documents/Arduino/libraries/`
   - **Linux**: `~/Arduino/libraries/`
4. Rename folder (remove "-master" suffix if present)
5. Restart Arduino IDE

---

## Library Download Links (If Manual Installation Needed)

### ESP32 Libraries

1. **Adafruit MLX90614**: https://github.com/adafruit/Adafruit-MLX90614-Library
2. **MAX30105**: https://github.com/sparkfun/SparkFun_MAX3010x_Sensor_Library
3. **Adafruit GFX**: https://github.com/adafruit/Adafruit-GFX-Library
4. **Adafruit SSD1306**: https://github.com/adafruit/Adafruit_SSD1306
5. **RF24**: https://github.com/nRF24/RF24
6. **TinyGPSPlus**: https://github.com/mikalhart/TinyGPSPlus

### Arduino Nano Libraries

1. **RF24**: https://github.com/nRF24/RF24
2. **Adafruit NeoPixel**: https://github.com/adafruit/Adafruit_NeoPixel

---

## Library Locations

### Where Arduino Stores Libraries

**Sketchbook Location**:
- File → Preferences → Sketchbook location

**Libraries Folder**:
- Usually: `[Sketchbook]/libraries/`

### Check Installed Libraries

- Sketch → Include Library
- Scroll down to see all installed libraries
- Libraries are grouped: Contributed, Builtin, ESP32, etc.

---

## Version Compatibility

### Tested Versions (Known Working)

| Library | Version | Notes |
|---------|---------|-------|
| Adafruit MLX90614 | 2.1.3 | Stable |
| MAX30105 | 1.2.1 | SparkFun version |
| Adafruit GFX | 1.11.9 | Required for displays |
| Adafruit SSD1306 | 2.5.9 | Works with GFX 1.11.x |
| RF24 | 1.4.8 | TMRh20 version |
| TinyGPSPlus | 1.0.3 | Latest stable |
| Adafruit NeoPixel | 1.12.0 | For WS2812 LEDs |

### ESP32 Board Package

- **Version**: 2.0.x or later
- **Tested on**: 2.0.11
- **Note**: Newer versions may have different WiFi behavior

---

## Common Library Conflicts

### Wire Library Conflict
**Symptom**: "Wire already defined" error
**Solution**: Don't include Wire.h manually - it's included by sensor libraries

### Multiple SPI Libraries
**Symptom**: SPI compilation errors
**Solution**: Only include SPI.h once at the top of your sketch

### Display Library Issues
**Symptom**: Display doesn't initialize
**Solution**: 
- GFX must be installed BEFORE SSD1306
- Ensure both are latest versions
- Match display size in code (128x64)

---

## Installation Checklist

Use this checklist to verify installation:

**ESP32:**
- [ ] ESP32 Board Support installed
- [ ] Adafruit MLX90614 Library
- [ ] MAX30105 Particle Sensor Library
- [ ] Adafruit GFX Library
- [ ] Adafruit SSD1306 Library
- [ ] RF24 Library
- [ ] TinyGPSPlus Library
- [ ] Test sketch compiles successfully

**Arduino Nano:**
- [ ] Arduino AVR Boards installed
- [ ] RF24 Library
- [ ] Adafruit NeoPixel Library
- [ ] Test sketch compiles successfully

---

## Getting Help

If you're still having issues:

1. **Check Serial Monitor**: Look for specific error messages
2. **Verify Board Selection**: Correct board must be selected
3. **Update Arduino IDE**: Ensure you have version 1.8.13 or later (or 2.x)
4. **Check GitHub Issues**: Search library GitHub for known issues
5. **Try Example Sketches**: Each library has examples - try those first

---

## Quick Start After Installation

### Test Individual Sensors

#### MLX90614 Test:
```cpp
#include <Adafruit_MLX90614.h>
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

void setup() {
  Serial.begin(115200);
  mlx.begin();
}

void loop() {
  Serial.println(mlx.readObjectTempC());
  delay(1000);
}
```

#### MAX30102 Test:
```cpp
#include <MAX30105.h>
MAX30105 particleSensor;

void setup() {
  Serial.begin(115200);
  particleSensor.begin();
  particleSensor.setup();
}

void loop() {
  Serial.println(particleSensor.getIR());
  delay(100);
}
```

#### OLED Test:
```cpp
#include <Adafruit_SSD1306.h>
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Hello World!");
  display.display();
}

void loop() {
}
```

---

**All libraries installed? Great! Proceed to the hardware assembly!**
