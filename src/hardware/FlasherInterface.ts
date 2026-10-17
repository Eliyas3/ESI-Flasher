import { DeviceInfo, FlashProgress, FlashSettings } from '../types/hardware';
import { FirmwareImageItem } from '../types/firmware';

export interface FlasherLogger {
  log(msg: string): void;
  info(msg: string): void;
  success(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug(msg: string): void;
}

export interface Flasher {
  readonly name: string;
  readonly targetFamily: 'ESP32' | 'ESP8266' | 'Arduino' | 'Demo';
  
  connect(baudRate?: number): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  getDeviceInfo(): Promise<DeviceInfo>;
  flash(
    images: FirmwareImageItem[],
    settings: FlashSettings,
    onProgress: (progress: FlashProgress) => void
  ): Promise<void>;
  erase(): Promise<void>;
  reset(): Promise<void>;
  isConnected(): boolean;
  getSerialPort(): SerialPort | null;
}
