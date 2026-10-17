export type BoardFamily = 'ESP32' | 'ESP8266' | 'Arduino';

export type ESP32Chip = 
  | 'ESP32'
  | 'ESP32-S2'
  | 'ESP32-S3'
  | 'ESP32-C2'
  | 'ESP32-C3'
  | 'ESP32-C5'
  | 'ESP32-C6'
  | 'ESP32-H2';

export type ESP8266Chip = 'ESP8266';

export type ArduinoBoard = 
  | 'Arduino Uno (ATmega328P)'
  | 'Arduino Nano (ATmega328P)'
  | 'Arduino Nano (Old Bootloader)'
  | 'Arduino Mega 2560'
  | 'Arduino Leonardo';

export type TargetChip = ESP32Chip | ESP8266Chip | ArduinoBoard;

export interface DeviceInfo {
  chip: string;
  adapter: string;
  usbId: string;
  mac: string;
  flashSize: string;
  flashMode: string;
  flashFreq: string;
  chipRevision?: string;
  features?: string;
  crystalFreq?: string;
}

export interface FlashProgress {
  fileIndex: number;
  totalFiles: number;
  percentage: number;
  bytesWritten: number;
  totalBytes: number;
  speedKBps: number;
  elapsedSeconds: number;
  etaSeconds: number;
  operation: string;
}

export type FlashBaudRate = 115200 | 230400 | 460800 | 921600 | 1500000;

export interface FlashSettings {
  eraseAll: boolean;
  baudRate: FlashBaudRate;
  flashMode: 'keep' | 'qio' | 'qout' | 'dio' | 'dout';
  flashFreq: 'keep' | '40m' | '80m';
  flashSize: 'keep' | 'detect' | '1MB' | '2MB' | '4MB' | '8MB' | '16MB';
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type FlashState = 
  | 'idle' 
  | 'preparing' 
  | 'erasing' 
  | 'writing' 
  | 'verifying' 
  | 'resetting' 
  | 'success' 
  | 'error';
