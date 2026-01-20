# Wiring Diagrams - Smart Ambulance System

## 🔌 Component Pin Mapping

### ESP32 NodeMCU Pinout Reference

```
                    ┌─────────┐
                    │   USB   │
                    └─────────┘
                    ┌─────────┐
         EN ────────┤         ├──────── VP (GPIO 36)
    VP (GPIO 39) ───┤         ├──────── VN (GPIO 39)
    VN (GPIO 34) ───┤         ├──────── 34
         35 ────────┤         ├──────── 35
         32 ────────┤         ├──────── 32
         33 ────────┤         ├──────── 33
         25 ────────┤         ├──────── 25
         26 ────────┤         ├──────── 26
         27 ────────┤         ├──────── 27
         14 ────────┤  ESP32  ├──────── 14
         12 ────────┤         ├──────── 12
        GND ────────┤         ├──────── 13
         13 ────────┤         ├──────── D2
        D2 (9) ─────┤         ├──────── D3
        D3 (10) ────┤         ├──────── 15
        CMD ────────┤         ├──────── 2
         5V ────────┤         ├──────── 0
        GND ────────┤         ├──────── 4 (CE - NRF)
         23 (MOSI)──┤         ├──────── 16 (GPS RX)
         22 (SCL)───┤         ├──────── 17 (GPS TX)
         TX ────────┤         ├──────── 5 (CSN - NRF)
         RX ────────┤         ├──────── 18 (SCK - NRF)
         21 (SDA)───┤         ├──────── 19 (MISO - NRF)
        GND ────────┤         ├──────── GND
         3V3 ───────┤         ├──────── 3V3
                    └─────────┘
```

**Key Pins Used in This Project:**
- GPIO 21 (SDA): I2C Data (OLED, MLX90614, MAX30102)
- GPIO 22 (SCL): I2C Clock (OLED, MLX90614, MAX30102)
- GPIO 23 (MOSI): SPI Data Out (NRF24L01)
- GPIO 19 (MISO): SPI Data In (NRF24L01)
- GPIO 18 (SCK): SPI Clock (NRF24L01)
- GPIO 4 (CE): NRF24L01 Chip Enable
- GPIO 5 (CSN): NRF24L01 Chip Select
- GPIO 16 (RX): GPS TX
- GPIO 17 (TX): GPS RX

---

## 📡 ESP32 Ambulance Unit - Complete Wiring

### Full Connection Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ESP32 AMBULANCE UNIT                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   MLX90614   │ (Temperature Sensor)
│    (I2C)     │
├──────────────┤
│ VCC ──────────────► 3.3V (ESP32)
│ GND ──────────────► GND
│ SDA ──────────────► GPIO 21
│ SCL ──────────────► GPIO 22
└──────────────┘

┌──────────────┐
│  MAX30102    │ (Pulse Oximeter)
│    (I2C)     │
├──────────────┤
│ VIN ──────────────► 3.3V
│ GND ──────────────► GND
│ SDA ──────────────► GPIO 21 (shared with MLX)
│ SCL ──────────────► GPIO 22 (shared with MLX)
└──────────────┘

┌──────────────┐
│ OLED Display │ (128x64)
│    (I2C)     │
├──────────────┤
│ VCC ──────────────► 3.3V or 5V (check display)
│ GND ──────────────► GND
│ SDA ──────────────► GPIO 21 (shared)
│ SCL ──────────────► GPIO 22 (shared)
└──────────────┘

┌──────────────┐
│  NRF24L01    │ (RF Transceiver) **CRITICAL: ADD 10µF CAP!**
│    (SPI)     │
├──────────────┤
│ VCC ──┬───────────► 3.3V (NOT 5V!)
│       │            
│      [10µF]────────► (Capacitor between VCC & GND)
│       │
│ GND ──┴───────────► GND
│ CE  ──────────────► GPIO 4
│ CSN ──────────────► GPIO 5
│ SCK ──────────────► GPIO 18
│ MOSI ─────────────► GPIO 23
│ MISO ─────────────► GPIO 19
└──────────────┘

┌──────────────┐
│  GPS Module  │ (NEO-6M or similar)
│   (Serial)   │
├──────────────┤
│ VCC ──────────────► 5V (or 3.3V, check module)
│ GND ──────────────► GND
│ TX  ──────────────► GPIO 16 (ESP32 RX)
│ RX  ──────────────► GPIO 17 (ESP32 TX)
└──────────────┘

Power Supply:
┌──────────────┐
│ USB Power    │
│   or 5V      │
├──────────────┤
│ 5V  ──────────────► ESP32 VIN or 5V pin
│ GND ──────────────► ESP32 GND
└──────────────┘

IMPORTANT NOTES:
1. ALL I2C devices share SDA (GPIO 21) and SCL (GPIO 22)
2. NRF24L01 MUST have 10µF capacitor between VCC and GND
3. Use 3.3V for NRF24L01 (5V will damage it!)
4. Common GND for all components
5. Keep NRF24L01 wires SHORT (< 10cm)
```

### I2C Bus Wiring Detail

```
ESP32                 
GPIO 21 (SDA) ────┬────► OLED SDA
                  ├────► MLX90614 SDA
                  └────► MAX30102 SDA

GPIO 22 (SCL) ────┬────► OLED SCL
                  ├────► MLX90614 SCL
                  └────► MAX30102 SCL

3.3V ─────────────┬────► OLED VCC
                  ├────► MLX90614 VCC
                  └────► MAX30102 VCC

GND ──────────────┴────► All GNDs connected
```

### SPI Bus Wiring Detail

```
ESP32                 NRF24L01
GPIO 23 (MOSI) ─────────► MOSI
GPIO 19 (MISO) ─────────► MISO
GPIO 18 (SCK)  ─────────► SCK
GPIO 5  (CSN)  ─────────► CSN
GPIO 4  (CE)   ─────────► CE

3.3V ───┬──────────────► VCC
        │
      [10µF]  ◄── CAPACITOR (REQUIRED!)
        │
GND ────┴──────────────► GND
```

---

## 🚦 Arduino Nano Traffic Unit - Complete Wiring

### Full Connection Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 ARDUINO NANO TRAFFIC UNIT                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│  NRF24L01    │ (RF Receiver) **ADD 10µF CAP!**
│    (SPI)     │
├──────────────┤
│ VCC ──┬───────────► 3.3V (Nano 3.3V pin)
│       │            
│      [10µF]────────► (Capacitor between VCC & GND)
│       │
│ GND ──┴───────────► GND
│ CE  ──────────────► Pin 9
│ CSN ──────────────► Pin 10
│ SCK ──────────────► Pin 13 (Hardware SPI)
│ MOSI ─────────────► Pin 11 (Hardware SPI)
│ MISO ─────────────► Pin 12 (Hardware SPI)
└──────────────┘

┌──────────────┐
│  WS2812 LED  │ (4 LEDs - Traffic Lights)
│    Strip     │
├──────────────┤
│ VCC ──────────────► 5V (External power recommended)
│ GND ──────────────► GND (Common with Nano)
│ DIN ──────────────► Pin 6 (Data)
│
│ Optional: 470Ω resistor on data line
│ Optional: 1000µF capacitor on power
└──────────────┘

Power Supply:
┌──────────────┐
│ USB or 5V    │
├──────────────┤
│ 5V  ──────────────► Nano VIN or 5V pin
│ GND ──────────────► Nano GND
└──────────────┘

LED STRIP LAYOUT:
  LED 0 ───► North Direction (Red/Yellow/Green)
  LED 1 ───► East Direction
  LED 2 ───► South Direction
  LED 3 ───► West Direction

WIRING NOTES:
1. NRF24L01 on 3.3V only!
2. WS2812 needs 5V power
3. For 4 LEDs: Max 240mA (can use USB power)
4. For more LEDs: Use external 5V supply
5. Keep NRF wires SHORT
```

### Arduino Nano Pinout Reference

```
                  ┌──────────┐
    D13 (SCK) ────┤  ○    ○ ├──── D12 (MISO)
         3V3  ────┤  ○    ○ ├──── D11 (MOSI)
        AREF  ────┤  ○    ○ ├──── D10 (CSN)
         A0   ────┤  ○    ○ ├──── D9  (CE)
         A1   ────┤  ○    ○ ├──── D8
         A2   ────┤  ○    ○ ├──── D7
         A3   ────┤  ○    ○ ├──── D6  (WS2812)
         A4   ────┤  ○    ○ ├──── D5
         A5   ────┤  ○    ○ ├──── D4
         A6   ────┤  ○    ○ ├──── D3
         A7   ────┤  ○    ○ ├──── D2
         5V   ────┤  ○    ○ ├──── GND
        RESET ────┤  ○    ○ ├──── RESET
         GND  ────┤  ○    ○ ├──── RX0
         VIN  ────┤  ○    ○ ├──── TX1
                  └──────────┘
                   USB Port
```

---

## 🔧 Breadboard Layout Suggestions

### ESP32 Ambulance Unit Breadboard

```
TOP RAIL: 3.3V
BOTTOM RAIL: GND

Row 1-10:   ESP32 NodeMCU (straddles center)
Row 15-20:  MLX90614 Temperature Sensor
Row 25-30:  MAX30102 Pulse Oximeter
Row 35-40:  OLED Display
Row 45-55:  NRF24L01 (with capacitor soldered on)
Row 60-65:  GPS Module

All I2C devices connect to:
- Left rail (3.3V)
- Right rail (GND)
- SDA/SCL jumper to ESP32 pins

NRF24L01 connects via jumper wires to SPI pins
GPS connects to GPIO 16/17 with jumpers
```

### Arduino Nano Traffic Unit Breadboard

```
TOP RAIL: 5V
BOTTOM RAIL: GND

Row 1-15:   Arduino Nano (straddles center)
Row 20-30:  NRF24L01 (with capacitor)
Row 35-40:  WS2812 connector

Simple layout:
- NRF on 3.3V rail (create separate rail with wire)
- WS2812 on 5V rail
- Common GND
```

---

## ⚡ Power Distribution

### ESP32 Unit Power Requirements

```
Component          Voltage    Current    Notes
─────────────────────────────────────────────────
ESP32              3.3V       250mA      Core
WiFi TX            3.3V       +250mA     Peaks to 500mA
MLX90614           3.3V       2mA        Very low
MAX30102           3.3V       50mA       LEDs on
OLED Display       3.3V/5V    20mA       Depends on model
NRF24L01 TX        3.3V       115mA      Peak during TX
GPS Module         3.3V/5V    50mA       Active mode
─────────────────────────────────────────────────
TOTAL (Peak)       ~700mA    Use 1A+ supply!

Power Supply Options:
1. USB 5V (1A minimum, 2A recommended)
2. Battery: 3.7V LiPo with boost to 5V
3. Wall adapter: 5V 2A
```

### Arduino Nano Unit Power Requirements

```
Component          Voltage    Current    Notes
─────────────────────────────────────────────────
Arduino Nano       5V         20mA       Core
NRF24L01           3.3V       115mA      Peak
WS2812 (4 LEDs)    5V         240mA      All white, max bright
─────────────────────────────────────────────────
TOTAL (Peak)       ~400mA    Can use USB power

For more LEDs:
- Each LED: ~60mA max
- Use external 5V supply for >10 LEDs
```

### Recommended Power Setup

**For Prototype/Testing:**
```
ESP32: USB cable from computer (500mA limit)
Nano:  USB cable from computer (500mA limit)
```

**For Deployment:**
```
ESP32: 5V 2A wall adapter or power bank
Nano:  5V 1A wall adapter
WS2812 (if many LEDs): Separate 5V supply
```

---

## 🛠️ Wire Color Coding (Recommended)

```
Color          Use
────────────────────────────────
Red            VCC / 3.3V / 5V
Black          GND
Yellow         I2C SDA (Data)
White          I2C SCL (Clock)
Orange         SPI MOSI
Blue           SPI MISO
Green          SPI SCK
Purple         SPI CS/CSN
Brown          GPIO signals
```

---

## 📏 Wire Length Guidelines

```
Connection Type     Max Length    Notes
──────────────────────────────────────────────
I2C (SDA/SCL)      1 meter       Add pull-ups for >30cm
SPI (to NRF)       10 cm         CRITICAL: Keep short!
Power (VCC/GND)    30 cm         Use thick wire (22 AWG)
Serial (GPS)       1 meter       OK to extend
GPIO signals       50 cm         Depends on signal
```

---

## 🔍 Testing Checklist

### Before Powering On:

- [ ] Visual inspection: No shorts (adjacent pins touching)
- [ ] Continuity: All GNDs connected
- [ ] Voltage check: VCC rails correct (3.3V or 5V)
- [ ] NRF24L01 capacitor: 10µF soldered between VCC & GND
- [ ] Polarity: All components correct orientation
- [ ] Loose wires: All connections firm

### After Powering On:

- [ ] Voltage measurement: Check 3.3V and 5V rails under load
- [ ] LED indicators: Power LEDs on
- [ ] Serial output: Check initialization messages
- [ ] Sensor readings: Test each sensor individually
- [ ] No heat: No components getting hot
- [ ] Current draw: Measure total current (should match calculations)

---

## 🚨 Safety Warnings

**DO NOT:**
- ❌ Connect 5V to 3.3V components
- ❌ Reverse power polarity
- ❌ Short VCC to GND
- ❌ Touch components while powered on
- ❌ Use damaged USB cables
- ❌ Power NRF24L01 without capacitor
- ❌ Exceed current ratings

**ALWAYS:**
- ✅ Double-check connections before power on
- ✅ Use correct voltage (3.3V vs 5V)
- ✅ Add capacitors on power lines
- ✅ Keep wires organized
- ✅ Test with multimeter first
- ✅ Start with low power mode

---

## 📸 Visual Aid Suggestions

For physical assembly, take photos of:
1. Complete breadboard layout (top view)
2. NRF24L01 with capacitor soldered
3. I2C bus connections (SDA/SCL shared)
4. Power rails (color-coded)
5. Final assembled unit

---

**TIP**: Use a breadboard power supply module with both 3.3V and 5V outputs for easier prototyping!
