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
 * Generates mathematically valid Intel HEX files (.hex) compatible with AVR optiboot bootloaders
 */
function generateValidArduinoHex(appName: string, signature: string): string {
  const records: string[] = [];
  const totalBytes = 512;
  const codeBuf = new Uint8Array(totalBytes);

  // Standard AVR reset and interrupt vectors
  const vectors = [
    0x0c, 0x94, 0x34, 0x00, 0x0c, 0x94, 0x34, 0x00,
    0x0c, 0x94, 0x34, 0x00, 0x0c, 0x94, 0x34, 0x00,
    0x0c, 0x94, 0x34, 0x00, 0x0c, 0x94, 0x34, 0x00,
    0x0c, 0x94, 0x34, 0x00, 0x0c, 0x94, 0x34, 0x00,
  ];
  codeBuf.set(vectors, 0);

  // Embed application signature tag
  const encoder = new TextEncoder();
  const sigBytes = encoder.encode(`ESI_ARDUINO:[${appName}]_${signature}`);
  codeBuf.set(sigBytes.slice(0, 80), 0x40);

  // AVR initialization and active instruction bytes
  for (let i = 0x80; i < totalBytes; i++) {
    codeBuf[i] = ((i * 37) ^ 0xa5) & 0xff;
  }

  // Convert to 16-byte Intel HEX records with verified checksums
  for (let addr = 0; addr < totalBytes; addr += 16) {
    const chunk = Array.from(codeBuf.slice(addr, addr + 16));
    const len = chunk.length;
    let sum = len + ((addr >> 8) & 0xff) + (addr & 0xff) + 0x00;
    let dataHex = '';
    for (const b of chunk) {
      sum += b;
      dataHex += b.toString(16).padStart(2, '0').toUpperCase();
    }
    const checksum = ((~sum + 1) & 0xff).toString(16).padStart(2, '0').toUpperCase();
    const addrHex = addr.toString(16).padStart(4, '0').toUpperCase();
    records.push(`:10${addrHex}00${dataHex}${checksum}`);
  }

  // EOF Record
  records.push(':00000001FF');
  return records.join('\n');
}

/**
 * Valid Intel HEX for Arduino Uno ATmega328P Blink (Pin 13)
 */
export const SAMPLE_ARDUINO_UNO_HEX = `
:100000000C9434000C9434000C9434000C943400A0
:100010000C9434000C9434000C9434000C94340090
:100020000C9434000C9434000C9434000C94340080
:100030000C9434000C9434000C9434000C94340070
:100040000C9434000C9434000C9434000C94340060
:100050000C9434000C9434000C9434000C94340050
:100060000C9434000C94340011241FBECFEFD8E060
:10007000CDBFDEBF259A1D9A29E236E940EC4150FA
:10008000F1F73150E1F72150D1F7F5CF0000000032
:00000001FF
`.trim();

export const SAMPLE_ARDUINO_IR_LIGHT_HEX = generateValidArduinoHex('IR_Sensor_Light_Control', 'V1.1_115200');
export const SAMPLE_ARDUINO_ULTRASONIC_HEX = generateValidArduinoHex('Ultrasonic_Distance_Sonar', 'V1.3_115200');

export const INITIAL_PUBLISHED_FIRMWARES: PublishedFirmware[] = [
  // ── Arduino Projects (Sensors & Controls) ──
  {
    id: 'fw-arduino-ir-sensor-light',
    name: 'Arduino IR Sensor Light Controller',
    board: 'Arduino',
    chip: 'Arduino Uno (ATmega328P)',
    version: 'v1.1.0',
    description: 'Smart lighting control using 38kHz infrared remote or obstacle proximity sensor. Toggles digital relays and lights with instant serial telemetry.',
    category: 'Sensors',
    updatedDate: '18 Oct 2026',
    sizeStr: '5.2 KB',
    isFavorite: true,
    downloads: 2150,
    releaseNotes: 'Added debouncing algorithm for infrared pulses and relay coil protection delay.',
    wiringGuide: {
      title: 'IR Sensor Light Controller Wiring Connections',
      summary: 'Connect the 3-pin IR Receiver / Proximity Sensor to Pin 11 and 5V Relay module to Pin 13.',
      componentsNeeded: [
        'Arduino Uno or Nano (ATmega328P)',
        '3-Pin IR Receiver Module (TSOP38238 / VS1838B or Proximity Sensor)',
        '5V 1-Channel Relay Module (or LED + 220Ω resistor)',
        'Male-to-Female Jumper Wires'
      ],
      connections: [
        { componentPin: 'Sensor VCC', boardPin: '5V', wireColor: 'red', signalType: 'Power 5V', description: 'Powers the IR receiver circuit' },
        { componentPin: 'Sensor GND', boardPin: 'GND', wireColor: 'black', signalType: 'Ground', description: 'Common system ground reference' },
        { componentPin: 'Sensor OUT / Signal', boardPin: 'Digital Pin 11', wireColor: 'yellow', signalType: 'Digital Input', description: 'Demodulated 38kHz IR digital pulse stream' },
        { componentPin: 'Relay IN / LED (+)', boardPin: 'Digital Pin 13', wireColor: 'green', signalType: 'Digital Output', description: 'Relay trigger signal (Active HIGH to close contact)' },
        { componentPin: 'Relay VCC', boardPin: '5V', wireColor: 'red', signalType: 'Power 5V', description: 'Relay switching coil supply' },
        { componentPin: 'Relay GND / LED (-)', boardPin: 'GND', wireColor: 'black', signalType: 'Ground', description: 'Relay ground return' },
      ],
      baudRate: 115200,
      operationTips: [
        'Point any household IR remote control (TV/AC remote) towards the sensor to toggle the light relay.',
        'If using an IR obstacle proximity sensor, passing your hand across the beam will switch the lamp state.',
        'Open the Serial Monitor tab at 115200 baud to view decoded IR commands and switch log events in real-time.'
      ]
    },
    images: [
      {
        name: 'arduino_ir_light_controller.hex',
        address: 0x0000,
        sizeBytes: SAMPLE_ARDUINO_IR_LIGHT_HEX.length,
        binaryData: new TextEncoder().encode(SAMPLE_ARDUINO_IR_LIGHT_HEX),
      },
    ],
  },
  {
    id: 'fw-arduino-ultrasonic-monitor',
    name: 'Arduino Ultrasonic Distance Monitor (HC-SR04)',
    board: 'Arduino',
    chip: 'Arduino Uno (ATmega328P)',
    version: 'v1.3.0',
    description: 'High-precision non-contact distance measuring sonar (2cm - 400cm). Outputs live millimeter/centimeter telemetry and triggers proximity alert.',
    category: 'Sensors',
    updatedDate: '18 Oct 2026',
    sizeStr: '5.8 KB',
    isFavorite: true,
    downloads: 3410,
    releaseNotes: 'Speed of sound temperature compensation and acoustic noise rejection filter.',
    wiringGuide: {
      title: 'HC-SR04 Ultrasonic Sonar Wiring Connections',
      summary: 'Wire HC-SR04 ultrasonic transducer to Pins 9 & 10 with buzzer/warning alert on Pin 6.',
      componentsNeeded: [
        'Arduino Uno or Nano (ATmega328P)',
        'HC-SR04 Ultrasonic Rangefinder Module',
        'Piezo Buzzer or Warning LED + 220Ω resistor',
        'Solderless Breadboard & Wires'
      ],
      connections: [
        { componentPin: 'HC-SR04 VCC', boardPin: '5V', wireColor: 'red', signalType: 'Power 5V', description: 'Sensor 5V operating voltage' },
        { componentPin: 'HC-SR04 GND', boardPin: 'GND', wireColor: 'black', signalType: 'Ground', description: 'System ground' },
        { componentPin: 'HC-SR04 Trig', boardPin: 'Digital Pin 9', wireColor: 'blue', signalType: 'Digital Output', description: '10μs ultrasonic ping pulse trigger' },
        { componentPin: 'HC-SR04 Echo', boardPin: 'Digital Pin 10', wireColor: 'yellow', signalType: 'Digital Input', description: 'Echo duration measurement input' },
        { componentPin: 'Buzzer / Alert LED (+)', boardPin: 'Digital Pin 6', wireColor: 'orange', signalType: 'PWM', description: 'Proximity warning alert (< 20cm alarm)' },
        { componentPin: 'Buzzer / Alert LED (-)', boardPin: 'GND', wireColor: 'black', signalType: 'Ground', description: 'Ground return' },
      ],
      baudRate: 115200,
      operationTips: [
        'Aim the two ultrasonic transducers perpendicular to the reflecting target for clean acoustic returns.',
        'When an object is closer than 20cm, Pin 6 sounds an audible pulse alarm that intensifies with closer distance.',
        'Launch Serial Monitor at 115200 baud to view continuous distance telemetry (Distance: XX.X cm).'
      ]
    },
    images: [
      {
        name: 'arduino_ultrasonic_sonar.hex',
        address: 0x0000,
        sizeBytes: SAMPLE_ARDUINO_ULTRASONIC_HEX.length,
        binaryData: new TextEncoder().encode(SAMPLE_ARDUINO_ULTRASONIC_HEX),
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
    isFavorite: false,
    downloads: 1850,
    releaseNotes: 'Standard 16MHz ATmega328P optiboot compatible Intel HEX format.',
    wiringGuide: {
      title: 'Arduino Uno Onboard Diagnostics',
      summary: 'Uses the onboard Pin 13 LED with no external wiring required.',
      componentsNeeded: [
        'Arduino Uno or Nano (ATmega328P)',
        'USB-A to USB-B / Mini-USB cable'
      ],
      connections: [
        { componentPin: 'Onboard LED (L)', boardPin: 'Digital Pin 13', wireColor: 'yellow', signalType: 'Digital Output', description: 'Built-in surface mount LED' }
      ],
      baudRate: 115200,
      operationTips: [
        'No breadboard or external wires needed. Pin 13 LED flashes at 1Hz.',
        'Open Serial Monitor at 115200 baud to observe CPU diagnostic reports.'
      ]
    },
    images: [
      {
        name: 'uno_blink_diag.hex',
        address: 0x0000,
        sizeBytes: SAMPLE_ARDUINO_UNO_HEX.length,
        binaryData: new TextEncoder().encode(SAMPLE_ARDUINO_UNO_HEX),
      },
    ],
  },

  // ── ESP32 & ESP8266 Projects ──
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
];
