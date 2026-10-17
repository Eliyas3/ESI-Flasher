export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug' | 'data';

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

export type LineEnding = 'none' | 'lf' | 'cr' | 'crlf';

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  manufacturer?: string;
  product?: string;
}
