# ESI Flasher — Eliyas Science Info ⚡

<div align="center">

<img src="./public/logo-original.jpg" alt="ESI Flasher Logo" width="140" />

### **Professional Web Serial Embedded Flasher**
*Flash ESP32, ESP8266, and Arduino microcontrollers directly from Google Chrome — 100% in-browser with zero desktop software or IDE installations.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Web Serial API](https://img.shields.io/badge/Web%20Serial-W3C%20Standard-4285F4.svg?logo=google-chrome)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)

[Live Demo](https://github.com/Eliyas3/ESI-Flasher) • [Supported Hardware](#-supported-hardware--microcontrollers) • [Built-in Projects](#-built-in-firmware-projects) • [Browser Support](#-browser-compatibility-matrix)

</div>

---

## 🌟 Overview

**ESI Flasher** is an industrial-grade, client-side embedded hardware flashing workstation built by **Eliyas Science Info**. It leverages the standard **W3C Web Serial API** and WebAssembly/JavaScript protocol engines to communicate directly with connected microcontrollers over USB, completely bypassing the need for Arduino IDE, ESP-IDF, Python, or command-line flashing tools.

All binary parsing, checksum validation, baud rate negotiation, bootloader syncing, and flash memory writing occur **strictly in local browser sandbox memory** — your firmware code is never transmitted to any remote cloud server.

---

## 🚀 Key Highlights

- ⚡ **100% Client-Side In-Memory Flashing**: Firmware binaries are parsed and written directly from browser memory via Web Serial. Zero cloud transmission.
- 🎯 **3-Step Streamlined Workflow**:
  1. **Connect Port**: Plug in your board via USB and select the serial COM port.
  2. **Select Firmware**: Choose from curated projects or drag & drop custom `.bin` / `.hex` files.
  3. **Flash Hardware**: High-speed programming with live byte progress, verification, and audio-visual cues.
- 🔌 **Full ESP32 Spectrum**: Official `esptool-js` engine with automatic chip detection (ESP32, S2, S3, C2, C3, C5, C6, H2).
- 📟 **ESP8266 Support**: Full ROM flash support at baud rates up to 460,800 bps.
- 🎛️ **Native Arduino AVR STK500v1 Engine**: In-browser STK500v1 bootloader protocol with DTR/RTS auto-reset pulse sequencing and Intel HEX parsing.
- 📋 **Integrated Hardware Pinouts**: Select an example project from the dropdown to instantly view a clean, tabular pinout guide.
- 🖥️ **Live Bi-Directional Serial Monitor**: Real-time terminal with configurable baud rates (9600 to 921600 bps), auto-scroll, log search/filtering, and interactive command sending.
- 📜 **Local Flash History**: Preserves flash session records (board, firmware, size, duration, status) in IndexedDB.
- 🌓 **Curated Dark & Light Mode**: Engineered with an aerospace-grade dark UI, high-contrast typography, and permanent brand accents.

---

## 🧩 Supported Hardware & Microcontrollers

| Platform | Target SoC / Board | Flash Baud Rate | Supported Format | Engine |
| :--- | :--- | :---: | :---: | :--- |
| **ESP32** | ESP32, ESP32-S2, ESP32-S3 | Up to 921,600 bps | `.bin` (Multi-image) | Espressif `esptool-js` |
| **ESP32-C** | ESP32-C2, ESP32-C3, ESP32-C5, ESP32-C6 | Up to 921,600 bps | `.bin` (Multi-image) | Espressif `esptool-js` |
| **ESP32-H** | ESP32-H2 (Zigbee / Thread / BLE) | Up to 921,600 bps | `.bin` (Multi-image) | Espressif `esptool-js` |
| **ESP8266** | ESP8266EX, NodeMCU v2, Wemos D1 Mini | Up to 460,800 bps | `.bin` (Single/Multi) | In-Memory ESP ROM Flasher |
| **Arduino** | Arduino Uno (ATmega328P) | 115,200 bps | `.hex` (Intel HEX) | ESI STK500v1 AVR Driver |
| **Arduino** | Arduino Nano (New Optiboot) | 115,200 bps | `.hex` (Intel HEX) | ESI STK500v1 AVR Driver |
| **Arduino** | Arduino Nano (Old Bootloader) | 57,600 bps | `.hex` (Intel HEX) | ESI STK500v1 AVR Driver |
| **Arduino** | Arduino Mega 2560 & Leonardo | Variable | `.hex` (Intel HEX) | ESI STK500v1 AVR Driver |

---

## 💡 Built-in Firmware Projects

The flasher comes pre-loaded with verified, ready-to-flash example projects directly selectable from the **Example Projects dropdown**:

### 1. Arduino IR Sensor Light Controller
- **Board**: Arduino Uno / Nano (ATmega328P)
- **Description**: Smart lighting automation using a 38kHz infrared receiver or proximity obstacle sensor. Toggles digital relays and lights with real-time serial event telemetry.
- **Baud Rate**: 115,200 bps

### 2. Arduino Ultrasonic Distance Monitor (HC-SR04)
- **Board**: Arduino Uno / Nano (ATmega328P)
- **Description**: High-precision non-contact ultrasonic distance measuring sonar (2cm – 400cm). Outputs live distance telemetry and triggers proximity alarms.
- **Baud Rate**: 115,200 bps

### 3. Arduino Uno Blink & Serial Diagnostics
- **Board**: Arduino Uno (ATmega328P)
- **Description**: Complete hardware self-test sketch pulsing onboard Pin 13 LED and streaming CPU clock speed, RAM usage, and uptime telemetry.
- **Baud Rate**: 115,200 bps

### 4. ESP32 WiFi Scanner & Analyzer
- **Board**: ESP32
- **Description**: High-speed 2.4GHz WiFi spectral scanner with real-time RSSI signal telemetry, channel distribution analysis, and serial reporting.
- **Baud Rate**: 115,200 bps

### 5. ESP32 BLE Beacon & Advertisement Scanner
- **Board**: ESP32
- **Description**: Bluetooth Low Energy (BLE 5.0) advertising beacon and surrounding device telemetry scanner with signal strength measurement.
- **Baud Rate**: 115,200 bps

### 6. ESP8266 Web Server & GPIO Switchboard
- **Board**: ESP8266 (NodeMCU / D1 Mini)
- **Description**: Standalone embedded HTTP web server hosting an in-browser control dashboard to toggle GPIO pins and relays across local WiFi.
- **Baud Rate**: 115,200 bps

---

## 🌐 Browser Compatibility Matrix

Web Serial is a standardized browser hardware API:

| Browser | Desktop Support | Mobile / Tablet | Notes |
| :--- | :---: | :---: | :--- |
| **Google Chrome** | ✅ Supported (v89+) | ⚠️ Android (OTG) | Recommended browser |
| **Microsoft Edge** | ✅ Supported (v89+) | ❌ | Full support on Windows & macOS |
| **Brave** | ✅ Supported | ❌ | Web Serial enabled by default |
| **Opera** | ✅ Supported | ❌ | Full Chromium compatibility |
| **Mozilla Firefox** | ❌ Not Supported | ❌ | Mozilla has not implemented Web Serial |
| **Apple Safari** | ❌ Not Supported | ❌ | Apple WebKit does not support Web Serial |

---

## 🛠️ USB UART Drivers Reference

If your operating system does not automatically detect your development board, install the corresponding virtual COM port driver:

| USB Bridge IC | Typical Boards | Driver Download Link |
| :--- | :--- | :--- |
| **CH340 / CH341** | Arduino Nano clones, NodeMCU v3, ESP32 budget devkits | [WCH Official Drivers](http://www.wch-ic.com/downloads/CH341SER_EXE.html) |
| **CP2102 / CP2104** | NodeMCU v2, ESP32 DevKitC, NodeMCU-32S | [Silicon Labs CP210x](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) |
| **FT232R** | Industrial controllers, FTDI breakout cables | [FTDI VCP Drivers](https://ftdichip.com/drivers/vcp-drivers/) |
| **CH9102F** | Newer ESP32-C3 / S3 boards | [WCH CH9102 Drivers](https://www.wch.cn/downloads/CH343SER_EXE.html) |

---

## 📂 Project Architecture

```
ESI-Flasher/
├── public/                 # Favicon, original logos, and manifest icons
├── src/
│   ├── components/
│   │   ├── admin/          # Admin Portal & manifest manager
│   │   ├── common/         # EsiLogo, sound effects, badges
│   │   ├── console/        # Terminal logs, Serial Monitor, History panel
│   │   ├── dashboard/      # FirmwareSelector, FlashTargetCard, Pinout views
│   │   └── modals/         # BootloaderHelpModal, TechDetailsModal
│   ├── hardware/           # Hardware Abstraction Layer (HAL)
│   │   ├── ArduinoAVRFlasher.ts # STK500v1 AVR flashing driver
│   │   ├── ESP32Flasher.ts      # Web Serial + esptool-js driver
│   │   ├── ESP8266Flasher.ts    # ESP8266 ROM protocol driver
│   │   └── FlasherInterface.ts  # Standard interface definition
│   ├── serial/             # STK500v1, Intel HEX parser, Serial streaming
│   ├── stores/             # Zustand stores (Flasher, Terminal, History)
│   ├── types/              # TypeScript hardware, firmware, and serial types
│   ├── utils/              # Sample firmwares, formatters, sound effects
│   ├── App.tsx             # Main interactive application
│   ├── main.tsx            # React root mount
│   └── index.css           # Tailwind design tokens
├── vercel.json             # Vercel SPA auto-deployment rules
├── vite.config.ts          # Vite build optimization
└── package.json            # Dependencies and build scripts
```

---

## 📄 License & Attribution

Developed with pride for **[Eliyas Science Info](https://github.com/Eliyas3)**.  
All intellectual property and branding rights reserved.
