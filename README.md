# ESI Flasher — Eliyas Science Info ⚡

<div align="center">

<img src="./public/logo.svg" alt="ESI Flasher Logo" width="120" height="120" />

### **Professional Web Serial Embedded Flasher**
*Flash ESP32, ESP8266, and Arduino microcontrollers directly from Google Chrome — 100% in-browser with zero desktop software or IDE installations.*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Eliyas3/ESI-Flasher)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Web Serial API](https://img.shields.io/badge/Web%20Serial-W3C%20Standard-4285F4.svg?logo=google-chrome)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
[![Vercel Ready](https://img.shields.io/badge/Deployment-Vercel%20SPA-000000.svg?logo=vercel)](https://vercel.com)

[Live Demo](https://github.com/Eliyas3/ESI-Flasher) • [Supported Hardware](#-supported-hardware--microcontrollers) • [Pinout Guides](#-interactive-pinout--wiring-guides) • [Vercel Deployment](#-deploying-to-vercel)

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
- 📋 **Integrated Hardware Pinout Guides**: Select an example project to instantly view clean, color-coded wiring tables (Component Pin, Board Pin, Wire Color, Signal Type).
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

## 📌 Interactive Pinout & Wiring Guides

When you select an example project from the dropdown menu, ESI Flasher displays a single, neat connection table showing you exactly how to hook up your sensors and actuators:

### 1. Arduino IR Sensor Light Controller
| Component Pin | Board Pin | Wire Color | Signal Type | Function / Description |
| :--- | :--- | :---: | :---: | :--- |
| **Sensor VCC** | `5V` | 🔴 Red | Power 5V | Powers the 38kHz infrared receiver circuit |
| **Sensor GND** | `GND` | ⚫ Black | Ground | Common system ground reference |
| **Sensor OUT** | `Digital Pin 11` | 🟡 Yellow | Digital Input | Demodulated 38kHz IR digital pulse stream |
| **Relay IN / LED (+)** | `Digital Pin 13` | 🟢 Green | Digital Output | Relay trigger signal (Active HIGH) |
| **Relay VCC** | `5V` | 🔴 Red | Power 5V | Relay switching coil supply |
| **Relay GND** | `GND` | ⚫ Black | Ground | Relay ground return |

### 2. Arduino Ultrasonic Distance Monitor (HC-SR04)
| Component Pin | Board Pin | Wire Color | Signal Type | Function / Description |
| :--- | :--- | :---: | :---: | :--- |
| **HC-SR04 VCC** | `5V` | 🔴 Red | Power 5V | Sensor 5V operating supply |
| **HC-SR04 GND** | `GND` | ⚫ Black | Ground | System ground |
| **HC-SR04 Trig** | `Digital Pin 9` | 🔵 Blue | Digital Output | 10µs ultrasonic ping pulse trigger |
| **HC-SR04 Echo** | `Digital Pin 10` | 🟡 Yellow | Digital Input | Acoustic echo duration return |
| **Buzzer / Alert (+)** | `Digital Pin 6` | 🟠 Orange | PWM | Proximity warning alert (< 20cm alarm) |
| **Buzzer / Alert (-)** | `GND` | ⚫ Black | Ground | Ground return |

---

## ☁️ Deploying to Vercel

This repository is pre-configured for **seamless zero-config deployment on Vercel**:

### Option 1: Automatic Vercel Git Integration (Recommended)
1. Push this repository to your GitHub account (`https://github.com/Eliyas3/ESI-Flasher`).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
3. Import the `ESI-Flasher` repository.
4. Vercel automatically detects **Vite** as the framework preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**. Your site will be live on an HTTPS-secured URL (e.g., `https://esi-flasher.vercel.app`).

> [!IMPORTANT]
> **Web Serial API requires HTTPS** in production. Vercel automatically provisions free SSL/TLS certificates, ensuring Web Serial works flawlessly out of the box.

### Option 2: Deploying via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Pre-configured `vercel.json`
The repository includes a dedicated [vercel.json](vercel.json) ensuring:
- SPA client-side routing rewrites (`/*` ➔ `/index.html`)
- Optimized static asset headers and security policies

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [Google Chrome](https://www.google.com/chrome/), [Microsoft Edge](https://www.microsoft.com/edge), or [Brave](https://brave.com/) (Web Serial API support required)

### Setup Steps
```bash
# 1. Clone the repository
git clone https://github.com/Eliyas3/ESI-Flasher.git

# 2. Enter project directory
cd ESI-Flasher

# 3. Install dependencies
npm install

# 4. Launch development dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Edge.

### Building for Production
```bash
# Typecheck and compile optimized bundle to /dist
npm run build

# Preview production build locally
npm run preview
```

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
├── public/                 # Favicon, SVG logos, and manifest icons
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
