# ESI Flasher — Eliyas Science Info

**Browser-Based Firmware Flashing Platform for ESP32, ESP8266, and Arduino AVR**

![ESI Flasher Logo](./public/logo-enhanced.png)

ESI Flasher is a production-grade, client-side web application designed to write firmware binaries directly to **ESP32**, **ESP8266**, and **Arduino AVR** microcontrollers over USB directly from the web browser.

Built with **React**, **TypeScript**, **Tailwind CSS**, **Web Serial API**, and **esptool-js**.

---

## 🌟 Key Features

- **100% Client-Side In-Memory Flashing**: Firmware files are parsed and flashed directly in your browser memory. Firmware is **never** uploaded to any backend server.
- **ESP32 Full Spectrum Support**: Flash standard ESP32, ESP32-S2, ESP32-S3, ESP32-C2, ESP32-C3, ESP32-C5, ESP32-C6, and ESP32-H2 using official Espressif `esptool-js`.
- **ESP8266 Support**: Flash NodeMCU and ESP8266EX boards at 460800 baud.
- **Arduino AVR STK500v1 Flasher**: In-browser STK500v1 bootloader engine for Arduino Uno and Arduino Nano (both New Optiboot and Old Bootloader), with native Intel HEX (`.hex`) parsing and DTR auto-reset pulsing.
- **Multi-Image Firmware Layout**: Configure custom flash partition offsets (e.g., Bootloader `0x1000`, Partition Table `0x8000`, App `0x10000`, or custom).
- **Live Device Interrogation**: Automatically reads Chip Model, MAC Address / Signature, Flash Memory Size, SPI Flash Frequency, SPI Mode, Crystal Frequency, and USB Bridge VID/PID.
- **Live Bi-directional Serial Monitor**: Built-in serial console supporting 9600 to 921600 baud, line ending configuration (LF, CR, CRLF), interactive commands, pause, and buffer clearing.
- **Local Flash History**: Preserves flash records (board, firmware, version, duration, date, outcome) in IndexedDB locally on your machine.
- **Demo / Simulation Mode**: Clearly distinguished simulation mode for UI development and verification without requiring attached hardware.
- **Dark & Light Mode**: Curated engineering theme featuring deep navy terminal screens, electric blue accents, and accessible contrast.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ or v20+
- **Google Chrome**, **Microsoft Edge**, **Brave**, or **Opera** on Desktop (Web Serial API required)

### Installation

```bash
# Clone or navigate to the repository
cd "ESI Flasher"

# Install dependencies
npm install
```

### Running Locally (Development)

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🌐 Browser Compatibility & HTTPS Requirements

Web Serial API is a modern W3C browser hardware specification:

| Browser | Desktop Support | Mobile / Tablet |
| :--- | :---: | :---: |
| **Google Chrome** | ✅ Supported (v89+) | ⚠️ Chrome OS / Android where OTG is enabled |
| **Microsoft Edge** | ✅ Supported (v89+) | ❌ |
| **Brave** | ✅ Supported | ❌ |
| **Opera** | ✅ Supported | ❌ |
| **Firefox** | ❌ Not implemented by Mozilla | ❌ |
| **Safari** | ❌ Not implemented by Apple | ❌ |

### Security Context
- **Development**: Web Serial runs on `http://localhost` and `http://127.0.0.1`.
- **Production Deployment**: Web Serial **strictly requires HTTPS**. Ensure your production host (e.g. Vercel, Netlify, Cloudflare Pages) serves over SSL/TLS.

---

## 🔌 Hardware Setup & USB Driver Reference

Most development boards interface with your PC via a USB-to-UART bridge IC:

### 1. Silicon Labs CP2102 / CP2104 (`VID: 0x10C4 / PID: 0xEA60`)
- Built-in on NodeMCU v2 and ESP32 DevKitC.
- Features automatic DTR/RTS reset circuits.

### 2. WCH CH340G / CH340C / CH341 (`VID: 0x1A86 / PID: 0x7523`)
- Extremely common on cost-effective ESP32, ESP8266, and Arduino Nano clone boards.
- Requires CH340 Windows/macOS drivers if not already recognized by your OS.

### 3. FTDI FT232R (`VID: 0x0403 / PID: 0x6001`)
- Common on high-reliability industrial modules and Arduino clones.

### 4. Espressif Native USB-JTAG / OTG (`VID: 0x303A`)
- Used on ESP32-S3 and ESP32-C3 USB native ports.

---

## ⚡ Manual Bootloader Mode Guide (Boot Button Instructions)

While most modern ESP boards reset automatically into download mode via DTR/RTS signals, bare modules or custom boards may fail to sync automatically.

If connection fails with a sync timeout:

1. **Press and hold the `BOOT` / `FLASH` button** on your ESP board (pulls GPIO0 LOW).
2. **Press and release the `EN` / `RST` button** momentarily (1 second).
3. **Click `Connect`** in the ESI Flasher web interface.
4. **Release the `BOOT` button** once the serial connection handshake begins.

---

## 🔬 Flashing Instructions

### Flashing ESP32 / ESP8266

1. Plug your ESP board into your computer with a reliable data USB cable (avoid charge-only cables).
2. Select your platform tab: **ESP32** or **ESP8266**.
3. Click **Connect** and select your board from the browser serial port selector prompt.
4. Choose a verified firmware build from the catalog or switch to **Flash Your Own** and drop your `.bin` file.
5. Review the SPI flash offset (standard applications: `0x10000` for ESP32, `0x0000` for ESP8266).
6. Click **Flash Now**. Observe live byte-level progress and MD5 verification.
7. Click **Open Serial Monitor** to interact with your board's live output.

### Flashing Arduino AVR (Uno & Nano)

1. Select **Arduino** under Flash Target.
2. Select your specific board:
   - `Arduino Uno (ATmega328P)` — 115200 baud
   - `Arduino Nano (ATmega328P)` — 115200 baud
   - `Arduino Nano (Old Bootloader)` — 57600 baud
3. Click **Connect** to open the port. The flasher pulses DTR and syncs with the STK500v1 bootloader.
4. Drop your compiled Intel HEX file (`.hex`).
5. Click **Flash Now**. ESI Flasher writes each 128-byte flash page sequentially and restarts your Arduino.

---

## 🛡️ Security & Privacy Architecture

- **Zero Cloud Binary Transmission**: Firmwares stay in your local browser sandbox memory (`Uint8Array`).
- **No Binaries in LocalStorage**: LocalStorage is reserved solely for theme and fallback metadata.
- **Content Integrity**: In-browser SHA-256 computation via standard `crypto.subtle.digest`.

---

## 🏗️ Project Architecture

```
src/
├── types/
│   ├── hardware.ts        # Board, Chip, DeviceInfo, FlashProgress types
│   ├── firmware.ts        # FirmwareManifest, FirmwareImageItem types
│   ├── serial.ts          # Serial and Terminal log types
│   └── history.ts         # FlashHistoryRecord types
├── hardware/              # Hardware Abstraction Layer (HAL)
│   ├── FlasherInterface.ts# Universal Flasher contract
│   ├── ESP32Flasher.ts    # Web Serial + esptool-js engine
│   ├── ESP8266Flasher.ts  # ESP8266 ROM flasher
│   ├── ArduinoAVRFlasher.ts# STK500v1 AVR bootloader flasher
│   └── DemoFlasher.ts     # Developer simulation mode
├── serial/
│   ├── SerialMonitor.ts   # Live bidirectional serial streaming
│   ├── stk500.ts          # STK500v1 protocol implementation
│   └── intelHex.ts        # Intel HEX parser for Arduino .hex
├── flasher/
│   └── checksum.ts        # Web Crypto SHA-256 hasher
├── stores/
│   ├── useFlasherStore.ts # Central state machine coordinating hardware
│   ├── useTerminalStore.ts# Pub-sub store for high-performance terminal logs
│   └── useHistoryStore.ts # IndexedDB history persistence store
├── components/
│   ├── common/            # EsiLogo, badges, buttons
│   ├── layout/            # Header, Hero, WorkflowSteps, BrowserCompatibilityAlert
│   ├── dashboard/         # FirmwareBrowser, FlashTarget, DeviceInfo, Settings, Progress
│   ├── console/           # TerminalConsole, SerialMonitorPanel, HistoryPanel
│   ├── admin/             # AdminModal for manifest publishing
│   └── modals/            # BootloaderHelpModal, TechDetailsModal
├── utils/
│   ├── formatters.ts      # Bytes, baud, USB ID formatting
│   ├── storage.ts         # IndexedDB wrappers
│   └── sampleFirmwares.ts # Pre-bundled verified sample firmwares
├── App.tsx
├── main.tsx
└── index.css
```

---

## 📝 How to Add New Firmware to the Catalog

Firmware manifests adhere to standard JSON schema:

```json
{
  "name": "ESI IoT Sensor Node",
  "version": "1.0.0",
  "board": "ESP32",
  "chip": "ESP32",
  "description": "Environmental sensor monitoring with MQTT publishing",
  "category": "IoT",
  "images": [
    {
      "path": "firmware.bin",
      "address": "0x10000"
    }
  ]
}
```

Use the in-app **Admin** button to generate, inspect, export, or publish new firmware manifests directly to the catalog.

---

## 📜 License

Engineered with precision for **Eliyas Science Info**. All rights reserved.
