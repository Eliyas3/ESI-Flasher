import { PublishedFirmware } from '../types/firmware';

/**
 * Creates a valid synthetic ESP32 binary image with proper ESP header:
 * Byte 0: Magic (0xE9)
 * Byte 1: Segments (0x01..0x03)
 * Byte 2: Flash Mode (0x02 = DIO)
 * Byte 3: Flash Freq / Size (0x20 = 40MHz / 4MB)
 * Bytes 4-7: Entry point
 */
function createSyntheticEsp32Binary(sizeBytes: number, appName: string): Uint8Array {
  const buf = new Uint8Array(sizeBytes);
  // ESP32 Image Header
  buf[0] = 0xe9; // Magic
  buf[1] = 0x03; // 3 segments
  buf[2] = 0x02; // Flash mode: DIO
  buf[3] = 0x20; // Flash size/freq: 4MB, 40MHz
  buf[4] = 0x10; // Entry point 0x40081010
  buf[5] = 0x10;
  buf[6] = 0x08;
  buf[7] = 0x40;

  // Embed ASCII signature string inside image
  const encoder = new TextEncoder();
  const sig = encoder.encode(`ESI_FIRMWARE:[${appName}]_VERSION:1.2_ESP32_IDF_V5.1`);
  buf.set(sig, 0x100);

  // Fill remainder with pseudo-firmware bytes
  for (let i = 0x200; i < sizeBytes; i += 64) {
    buf[i] = (i * 17) & 0xff;
    buf[i + 1] = (i ^ 0xaa) & 0xff;
  }

  return buf;
}

/**
 * Valid Intel HEX for Arduino Uno ATmega328P Blink (Pin 13)
 */
export const SAMPLE_ARDUINO_UNO_HEX = `
:100000000C9434000C9449000C9449000C944900E4
:100010000C9449000C9449000C9449000C944900C4
:100020000C9449000C9449000C9449000C944900B4
:100030000C9449000C9449000C9449000C944900A4
:100040000C9449000C9449000C9449000C94490094
:100050000C9449000C9449000C9449000C94490084
:100060000C9449000C94490011241FBECFEFD4E01F
:10007000DEBFCDBF11E0A0E0B1E0ECE0FDE002C051
:1000800005900D92A030B107D9F711E02FEF38E09D
:1000900024B935B92898089580910001882329F0D9
:1000A00090910101982309F0809102018823E1F731
:1000B000809103018823C9F7289A08952898089531
:0400C0000C940000EC
:00000001FF
`.trim();

export const INITIAL_PUBLISHED_FIRMWARES: PublishedFirmware[] = [
  {
    id: 'fw-esp32-wifi-scanner',
    name: 'ESP32 WiFi Scanner & Analyzer',
    board: 'ESP32',
    chip: 'ESP32',
    version: 'v1.2.0',
    description: 'High-speed 2.4GHz WiFi scanner with live RSSI signal telemetry, channel distribution, and serial terminal reporting.',
    category: 'Wireless',
    updatedDate: '15 Oct 2026',
    sizeStr: '1.42 MB',
    isFavorite: true,
    downloads: 1420,
    releaseNotes: 'Added 5GHz channel detection compatibility and ANSI color terminal UI.',
    images: [
      {
        name: 'wifi_scanner_app.bin',
        address: 0x10000,
        sizeBytes: 1488976,
        binaryData: createSyntheticEsp32Binary(1488976, 'ESP32_WiFi_Scanner'),
      },
    ],
  },
  {
    id: 'fw-esp32-ble-beacon',
    name: 'ESP32 BLE Environmental Beacon',
    board: 'ESP32',
    chip: 'ESP32',
    version: 'v1.0.4',
    description: 'Ultra-low power Bluetooth Low Energy beacon advertising telemetry, iBeacon packets, and Eddystone protocols.',
    category: 'IoT',
    updatedDate: '02 Oct 2026',
    sizeStr: '1.18 MB',
    isFavorite: false,
    downloads: 870,
    releaseNotes: 'Optimized deep sleep intervals to 20uA current draw.',
    images: [
      {
        name: 'ble_beacon.bin',
        address: 0x10000,
        sizeBytes: 1237248,
        binaryData: createSyntheticEsp32Binary(1237248, 'ESP32_BLE_Beacon'),
      },
    ],
  },
  {
    id: 'fw-esp32-micropython',
    name: 'MicroPython ESP32 v1.22 Runtime',
    board: 'ESP32',
    chip: 'ESP32',
    version: 'v1.22.2',
    description: 'Official MicroPython firmware with async REPL, urequests, WiFi, and WebREPL support.',
    category: 'Utilities',
    updatedDate: '28 Sep 2026',
    sizeStr: '1.85 MB',
    isFavorite: true,
    downloads: 3200,
    releaseNotes: 'Latest stable release with ESP32-S3 and SPIRAM auto-detection.',
    images: [
      {
        name: 'esp32_micropython.bin',
        address: 0x1000,
        sizeBytes: 1939872,
        binaryData: createSyntheticEsp32Binary(1939872, 'MicroPython_ESP32'),
      },
    ],
  },
  {
    id: 'fw-esp8266-blink-web',
    name: 'ESP8266 WiFi Portal & AP',
    board: 'ESP8266',
    chip: 'ESP8266',
    version: 'v2.1.0',
    description: 'Captive portal configuration manager for ESP8266 / NodeMCU boards with integrated web dashboard.',
    category: 'IoT',
    updatedDate: '20 Sep 2026',
    sizeStr: '480 KB',
    isFavorite: false,
    downloads: 640,
    releaseNotes: 'Modern glassmorphism captive portal UI and persistent EEPROM storage.',
    images: [
      {
        name: 'esp8266_portal.bin',
        address: 0x0000,
        sizeBytes: 491520,
        binaryData: createSyntheticEsp32Binary(491520, 'ESP8266_WiFi_Portal'),
      },
    ],
  },
  {
    id: 'fw-arduino-uno-blink',
    name: 'Arduino Uno Blink & Serial Diagnostics',
    board: 'Arduino',
    chip: 'Arduino Uno (ATmega328P)',
    version: 'v1.0.0',
    description: 'Hardware verification sketch: pulses onboard Pin 13 LED and outputs CPU clocks and RAM diagnostics to Serial at 115200 baud.',
    category: 'Demos',
    updatedDate: '12 Sep 2026',
    sizeStr: '4.8 KB',
    isFavorite: true,
    downloads: 1850,
    releaseNotes: 'Standard 16MHz ATmega328P optiboot compatible Intel HEX format.',
    images: [
      {
        name: 'uno_blink_diag.hex',
        address: 0x0000,
        sizeBytes: SAMPLE_ARDUINO_UNO_HEX.length,
        binaryData: new TextEncoder().encode(SAMPLE_ARDUINO_UNO_HEX),
      },
    ],
  },
];
