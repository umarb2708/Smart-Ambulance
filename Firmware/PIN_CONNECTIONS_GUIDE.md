# 🔌 Smart Ambulance System - Pin Connections & Voltage Guide

## 📋 Hardware Components List

| Component | Communication | Voltage | Quantity |
|-----------|--------------|---------|----------|
| ESP32 NodeMCU | Main Controller | 3.3V Logic | 1 |
| MLX90614 IR Temperature Sensor | I2C | 3.3V | 1 |
| MAX30102 Pulse Oximeter | I2C | 3.3V / 1.8V | 1 |
| SSD1306 OLED Display (0.96") | I2C | 3.3V - 5V | 1 |
| NRF24L01 RF Transceiver | SPI | 3.3V ⚠️ | 1 |
| GPS Module (NEO-6M/7M/8M) | Serial UART | 3.3V - 5V | 1 |

---

## ⚠️ CRITICAL: Voltage Levels

### ESP32 Specifications
- **Operating Voltage**: 3.3V
- **Input Voltage (VIN)**: 5V (via USB or VIN pin)
- **GPIO Voltage**: 3.3V (NOT 5V tolerant!)
- **Maximum Current per GPIO**: 12mA
- **Maximum Total Current**: 200mA

### Important Warnings
🚨 **NEVER connect 5V directly to ESP32 GPIO pins!**
🚨 **NRF24L01 MUST use 3.3V - Will damage at 5V!**
🚨 **Use voltage divider or level shifter for 5V sensors**

---

## 🔧 Complete Pin Connection Guide

### 1️⃣ I2C Devices (MLX90614, MAX30102, OLED)

All I2C devices share the same bus:

```
ESP32 NodeMCU I2C Pins:
├── SDA (GPIO 21) ──┬── MLX90614 SDA
│                   ├── MAX30102 SDA
│                   └── OLED SDA
│
└── SCL (GPIO 22) ──┬── MLX90614 SCL
                    ├── MAX30102 SCL
                    └── OLED SCL
```

#### MLX90614 IR Temperature Sensor

| MLX90614 Pin | ESP32 Pin | Wire Color (Suggested) |
|--------------|-----------|------------------------|
| VDD | 3.3V | Red |
| VSS (GND) | GND | Black |
| SDA | GPIO 21 | Yellow/Green |
| SCL | GPIO 22 | Blue/White |

**Voltage**: 3.3V ✅  
**I2C Address**: 0x5A (default)  
**Pull-up Resistors**: 4.7kΩ on SDA and SCL (usually built-in on ESP32)

```
MLX90614              ESP32
┌─────────┐          ┌──────┐
│ VDD     ├──────────┤ 3.3V │
│ VSS     ├──────────┤ GND  │
│ SDA     ├──────────┤ 21   │
│ SCL     ├──────────┤ 22   │
└─────────┘          └──────┘
```

---

#### MAX30102 Pulse Oximeter & Heart Rate Sensor

| MAX30102 Pin | ESP32 Pin | Wire Color (Suggested) |
|--------------|-----------|------------------------|
| VIN | 3.3V | Red |
| GND | GND | Black |
| SDA | GPIO 21 | Yellow/Green |
| SCL | GPIO 22 | Blue/White |
| INT | Not Connected | - |

**Voltage**: 3.3V (some modules support 1.8V-5V)  
**I2C Address**: 0x57 (default)  
**Note**: Sensor has internal LDO, can accept 5V on some breakout boards

```
MAX30102              ESP32
┌─────────┐          ┌──────┐
│ VIN     ├──────────┤ 3.3V │
│ GND     ├──────────┤ GND  │
│ SDA     ├──────────┤ 21   │
│ SCL     ├──────────┤ 22   │
│ INT     │ (unused) │      │
└─────────┘          └──────┘
```

**Important**: Make sure finger is properly placed on sensor for accurate readings!

---

#### SSD1306 OLED Display (0.96" 128x64)

| OLED Pin | ESP32 Pin | Wire Color (Suggested) |
|----------|-----------|------------------------|
| VCC | 3.3V | Red |
| GND | GND | Black |
| SDA | GPIO 21 | Yellow/Green |
| SCL | GPIO 22 | Blue/White |

**Voltage**: 3.3V - 5V (most modules have onboard regulator)  
**I2C Address**: 0x3C or 0x3D (default: 0x3C)  
**Note**: Can use 5V on VCC if module has voltage regulator

```
OLED Display          ESP32
┌─────────┐          ┌──────┐
│ VCC     ├──────────┤ 3.3V │ (or 5V if module supports)
│ GND     ├──────────┤ GND  │
│ SDA     ├──────────┤ 21   │
│ SCL     ├──────────┤ 22   │
└─────────┘          └──────┘
```

---

### 2️⃣ NRF24L01 RF Transceiver (SPI)

⚠️ **CRITICAL**: NRF24L01 operates at **3.3V ONLY** - 5V will **DESTROY** it!

| NRF24L01 Pin | ESP32 Pin | Function | Wire Color |
|--------------|-----------|----------|------------|
| VCC | 3.3V | Power | Red |
| GND | GND | Ground | Black |
| CE | GPIO 4 | Chip Enable | Orange |
| CSN | GPIO 5 | Chip Select | Yellow |
| SCK | GPIO 18 | SPI Clock | Blue |
| MOSI | GPIO 23 | Master Out Slave In | Green |
| MISO | GPIO 19 | Master In Slave Out | Purple |
| IRQ | Not Connected | Interrupt (optional) | - |

**Voltage**: **3.3V ONLY** ⚠️  
**Power Consumption**: 11-13mA (RX), up to 115mA (TX at max power)  
**Recommended**: Add 10µF capacitor between VCC and GND (close to module)

```
NRF24L01 Module       ESP32 NodeMCU
┌─────────────┐      ┌──────┐
│ VCC    (1)  ├──────┤ 3.3V │ ⚠️ NOT 5V!
│ GND    (2)  ├──────┤ GND  │
│ CE     (3)  ├──────┤ 4    │
│ CSN    (4)  ├──────┤ 5    │
│ SCK    (5)  ├──────┤ 18   │
│ MOSI   (6)  ├──────┤ 23   │
│ MISO   (7)  ├──────┤ 19   │
│ IRQ    (8)  │      │      │ (not used)
└─────────────┘      └──────┘

Pin Layout (Top View):
┌───────────────┐
│ 1 2 3 4      │
│ o o o o      │ Antenna
│             │
│ o o o o      │
│ 5 6 7 8      │
└───────────────┘
```

**Power Stability Tips**:
1. Add 10µF electrolytic capacitor across VCC-GND
2. Add 100nF ceramic capacitor across VCC-GND
3. Use separate 3.3V regulator if ESP32 power is unstable
4. Keep wires short (<10cm)

---

### 3️⃣ GPS Module (NEO-6M / NEO-7M / NEO-8M)

| GPS Pin | ESP32 Pin | Function | Wire Color |
|---------|-----------|----------|------------|
| VCC | 5V (VIN) | Power | Red |
| GND | GND | Ground | Black |
| TX | GPIO 16 (RX2) | GPS Transmit to ESP32 | Green |
| RX | GPIO 17 (TX2) | GPS Receive from ESP32 | Blue |
| PPS | Not Connected | Pulse Per Second (optional) | - |

**Voltage**: 3.3V - 5V (most modules accept both)  
**Current**: ~50mA (can spike to 100mA during satellite acquisition)  
**Note**: Uses **Hardware Serial2** on ESP32

```
GPS Module (NEO-6M)   ESP32
┌─────────┐          ┌──────┐
│ VCC     ├──────────┤ 5V   │ (or 3.3V)
│ GND     ├──────────┤ GND  │
│ TX      ├──────────┤ 16   │ (RX2)
│ RX      ├──────────┤ 17   │ (TX2)
│ PPS     │          │      │ (unused)
└─────────┘          └──────┘
```

**Important GPS Notes**:
- GPS needs **clear view of sky** - won't work indoors!
- First fix can take 30 seconds to 5 minutes
- Module has built-in antenna (ceramic patch)
- Can use external active antenna for better signal

---

## 🔌 Complete Wiring Diagram (All Components)

```
                        ESP32 NodeMCU Development Board
                    ┌──────────────────────────────────┐
                    │                                  │
       ┌────────────┤ 3.3V                             │
       │     ┌──────┤ GND                              │
       │     │  ┌───┤ GPIO 21 (SDA) ──────────────────┼─── I2C Bus (SDA)
       │     │  │┌──┤ GPIO 22 (SCL) ──────────────────┼─── I2C Bus (SCL)
       │     │  ││  │                                  │
       │     │  ││  │ GPIO 4  ─────────────────────────── NRF24L01 CE
       │     │  ││  │ GPIO 5  ─────────────────────────── NRF24L01 CSN
       │     │  ││  │ GPIO 18 ─────────────────────────── NRF24L01 SCK
       │     │  ││  │ GPIO 19 ─────────────────────────── NRF24L01 MISO
       │     │  ││  │ GPIO 23 ─────────────────────────── NRF24L01 MOSI
       │     │  ││  │                                  │
       │     │  ││  │ GPIO 16 (RX2) ────────────────────── GPS TX
       │     │  ││  │ GPIO 17 (TX2) ────────────────────── GPS RX
       │     │  ││  │                                  │
       │     │  ││  │ 5V (VIN) ─────────────────────────── GPS VCC
       │     │  ││  │                                  │
       │     │  ││  └──────────────────────────────────┤
       │     │  ││                                     │
       │     │  └┼─────── I2C SDA Bus ─────────────────┤
       │     │   └──────── I2C SCL Bus ─────────────────┤
       │     │                                          │
       │     └─────────── Common Ground ────────────────┤
       │                                                │
       └───────────────── 3.3V Power Rail ──────────────┤
                                                        │
                    └──────────────────────────────────┘

I2C Devices (shared bus):
  • MLX90614 (Temperature) - Address: 0x5A
  • MAX30102 (Heart Rate/SpO2) - Address: 0x57
  • OLED Display - Address: 0x3C

SPI Device:
  • NRF24L01 (RF Transceiver) - CE: 4, CSN: 5

Serial Device:
  • GPS Module - RX2: 16, TX2: 17
```

---

## 🔋 Power Supply Requirements

### Option 1: USB Power (5V)
```
USB Cable (5V, 2A) ──→ ESP32 Micro-USB Port
                       │
                       ├──→ 3.3V (internal regulator) ──→ All 3.3V sensors
                       └──→ 5V (VIN pin) ──→ GPS Module
```

**Required**: USB power supply with **at least 1.5A** capacity

### Option 2: External Battery
```
Li-Ion Battery (3.7V-4.2V) ──→ Battery Input
  OR
9V Battery ──→ Voltage Regulator (7805) ──→ 5V ──→ ESP32 VIN
```

### Current Consumption Breakdown

| Component | Current Draw | Notes |
|-----------|-------------|-------|
| ESP32 (WiFi Active) | 80-240mA | Peak during transmission |
| MLX90614 | 1.5mA | Very low power |
| MAX30102 | 50mA | LEDs on during measurement |
| OLED Display | 10-20mA | Depends on pixels lit |
| NRF24L01 (TX) | 11-115mA | 11mA standby, 115mA max TX |
| GPS Module | 50-100mA | 50mA tracking, 100mA acquisition |
| **TOTAL** | **~200-500mA** | Use 1.5-2A power supply |

---

## 🛠️ Breadboard Layout Example

```
Power Rails:
  Red (+)  : 3.3V
  Blue (-) : GND

                    Breadboard
    ═══════════════════════════════════════
    + ─────────────────────────────────── + (3.3V)
    - ─────────────────────────────────── - (GND)
    
    [MLX90614]    [MAX30102]    [OLED]
       │ │ │ │       │ │ │ │     │ │ │ │
       │ │ │ │       │ │ │ │     │ │ │ │
       V G S S       V G S S     V G S S
       C N D C       I N D C     C N D C
       C D A L       N D A L     C D A L
       │ │ │ │       │ │ │ │     │ │ │ │
       └─┴─┴─┴───────┴─┴─┴─┴─────┴─┴─┴─┘
         │ │ │         │ │ │       │ │ │
    + ──┘ │ │         │ │ │       │ │ │
    - ────┘ │         │ │         │ │ │
    21 ─────┴─────────┴─┴─────────┘ │ │
    22 ─────────────────┴───────────┘ │
    - ───────────────────────────────┘

    [ESP32]           [NRF24L01]
    ┌─────┐          ┌──────────┐
    │     │          │ 1 2 3 4  │
    │ USB ├──5V      │ o o o o  │
    │     │          │          │
    └─────┘          │ o o o o  │
                     │ 5 6 7 8  │
                     └──────────┘
                      │ │ │ │ │ │ │
                      1 2 3 4 5 6 7
                      │ │ │ │ │ │ │
                 3.3V─┘ │ │ │ │ │ │
                 GND────┘ │ │ │ │ │
                 GPIO4────┘ │ │ │ │
                 GPIO5──────┘ │ │ │
                 GPIO18───────┘ │ │
                 GPIO23─────────┘ │
                 GPIO19───────────┘

    [GPS Module]
    ┌──────────┐
    │ VCC GND  │
    │ TX  RX   │
    └──────────┘
      │   │ │  │
      5V  │ │  17 (TX2)
      GND─┘ │
      16────┘ (RX2)
```

---

## 🧪 Testing Each Component

### 1. Test I2C Devices (Scanner Code)

```cpp
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // SDA, SCL
  Serial.println("\nI2C Scanner");
}

void loop() {
  byte error, address;
  int devices = 0;
  
  Serial.println("Scanning...");
  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("Device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      devices++;
    }
  }
  
  Serial.println(devices > 0 ? "Done" : "No devices found");
  delay(5000);
}
```

**Expected Output**:
```
Scanning...
Device found at 0x3C  ← OLED
Device found at 0x57  ← MAX30102
Device found at 0x5A  ← MLX90614
Done
```

### 2. Test NRF24L01

```cpp
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(4, 5); // CE, CSN

void setup() {
  Serial.begin(115200);
  if (radio.begin()) {
    Serial.println("NRF24L01 OK!");
  } else {
    Serial.println("NRF24L01 FAILED - Check wiring & 3.3V!");
  }
}

void loop() {}
```

### 3. Test GPS

```cpp
#include <HardwareSerial.h>
#include <TinyGPS++.h>

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
  Serial.println("GPS Test - Go outside for signal!");
}

void loop() {
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    Serial.write(c); // Show raw NMEA data
    
    if (gps.encode(c)) {
      if (gps.location.isValid()) {
        Serial.print("\nLat: ");
        Serial.println(gps.location.lat(), 6);
        Serial.print("Lon: ");
        Serial.println(gps.location.lng(), 6);
      }
    }
  }
}
```

---

## ⚡ Common Issues & Solutions

### Problem: NRF24L01 not detected
**Causes**:
- Using 5V instead of 3.3V ⚠️
- Poor power supply (voltage drop)
- Bad connections

**Solutions**:
1. **Verify 3.3V** with multimeter
2. Add 10µF + 100nF capacitors at module
3. Check all 8 connections with multimeter
4. Try lower power level: `radio.setPALevel(RF24_PA_LOW);`
5. Use external 3.3V regulator

### Problem: I2C devices not responding
**Causes**:
- Wrong I2C address
- Missing pull-up resistors
- SDA/SCL swapped

**Solutions**:
1. Run I2C Scanner code (above)
2. Add 4.7kΩ pull-ups on SDA & SCL
3. Verify connections: SDA=21, SCL=22
4. Try lower I2C speed: `Wire.setClock(100000);`

### Problem: GPS no fix
**Causes**:
- Indoors (GPS needs sky view!)
- Antenna not connected
- Wrong baud rate

**Solutions**:
1. **Go outside** - GPS won't work indoors!
2. Wait 30 seconds to 5 minutes for first fix
3. Check TX/RX aren't swapped
4. Verify 9600 baud rate
5. Check antenna connection

### Problem: MAX30102 reads zero
**Causes**:
- Finger not placed correctly
- Insufficient pressure
- Sensor not powered

**Solutions**:
1. Place finger **firmly** on sensor
2. Cover LED completely
3. Wait 5-10 seconds for reading
4. Try different finger
5. Clean sensor surface

### Problem: ESP32 resets randomly
**Causes**:
- Insufficient power (brownout)
- NRF24L01 power surge
- USB cable too thin

**Solutions**:
1. Use 2A power supply
2. Add capacitors on NRF24L01
3. Use thicker/shorter USB cable
4. Power NRF24L01 from external 3.3V
5. Reduce NRF24L01 power: `RF24_PA_LOW`

---

## 📦 Parts List with Specifications

| Part | Specifications | Approx. Price |
|------|---------------|---------------|
| ESP32 NodeMCU | 240MHz, WiFi, Bluetooth, 36 GPIO | $5-8 |
| MLX90614 | -40°C to 125°C, I2C, 3.3V | $8-12 |
| MAX30102 | Heart Rate + SpO2, I2C, 3.3V | $3-5 |
| OLED 0.96" | 128x64, I2C, SSD1306 | $3-5 |
| NRF24L01 | 2.4GHz, 3.3V, SPI | $2-4 |
| NRF24L01+PA+LNA | Extended range version | $5-8 |
| GPS NEO-6M | UART, 5V, with antenna | $8-12 |
| Breadboard | 830 points | $3-5 |
| Jumper Wires | Male-Male, Male-Female | $2-3 |
| Capacitors | 10µF, 100nF | $1-2 |
| USB Cable | Micro-USB, 2A rated | $2-3 |

**Total Cost**: ~$40-70 USD

---

## 🎓 Pro Tips

1. **Always use 3.3V for NRF24L01** - Most common mistake!
2. **Add capacitors** on NRF24L01 for stability
3. **Use short wires** - Long wires cause interference
4. **Test each sensor individually** before combining
5. **GPS needs outdoor** - Won't work inside buildings
6. **Label all wires** with tape for easy debugging
7. **Use breadboard first** before soldering
8. **Measure voltages** with multimeter to verify
9. **Check I2C addresses** with scanner before coding
10. **Power from USB during development** - Batteries later

---

## 📸 Visual Pin Reference

### ESP32 NodeMCU Pinout
```
                           ┌─────┐
                     3.3V ─┤     ├─ GND
                      GND ─┤     ├─ GPIO23 (MOSI)
            (RX2) GPIO16 ─┤     ├─ GPIO22 (SCL)
            (TX2) GPIO17 ─┤     ├─ GPIO1 (TX)
                 GPIO5   ─┤     ├─ GPIO3 (RX)
                 GPIO18  ─┤ESP  ├─ GPIO21 (SDA)
                 GPIO19  ─┤32   ├─ GND
                 GPIO21  ─┤NODE ├─ GPIO19 (MISO)
                 GPIO22  ─┤MCU  ├─ GPIO18 (SCK)
                 GPIO23  ─┤     ├─ GPIO5 (CSN)
                 3.3V    ─┤     ├─ GPIO4 (CE)
                     EN  ─┤     ├─ GPIO2
                 GPIO36  ─┤     ├─ GPIO15
                 GPIO39  ─┤ USB ├─ GND
                 GPIO34  ─┤     ├─ VIN (5V)
                 GPIO35  ─┤     ├─ 3.3V
                           └─────┘
```

---

**📌 Save this guide for reference during assembly!**

For troubleshooting, always:
1. Check power (measure with multimeter)
2. Verify connections (use continuity test)
3. Test components individually
4. Check serial monitor output
5. Consult datasheets if needed
