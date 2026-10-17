export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatHexAddress(addr: number): string {
  return '0x' + addr.toString(16).toUpperCase().padStart(4, '0');
}

export function parseHexOrDec(input: string): number {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.startsWith('0x')) {
    return parseInt(trimmed.substring(2), 16);
  }
  return parseInt(trimmed, 10);
}

export function formatUsbId(vendorId?: number, productId?: number): string {
  if (!vendorId) return '—';
  const vid = vendorId.toString(16).toUpperCase().padStart(4, '0');
  const pid = productId ? productId.toString(16).toUpperCase().padStart(4, '0') : '????';
  return `VID: 0x${vid} / PID: 0x${pid}`;
}

export function identifyUsbAdapter(vendorId?: number, productId?: number): string {
  if (!vendorId) return 'Unknown USB Serial';
  
  // Well-known USB-to-UART bridge chips
  if (vendorId === 0x10c4) return 'Silicon Labs CP210x';
  if (vendorId === 0x1a86) return 'WCH CH340 / CH341';
  if (vendorId === 0x0403) return 'FTDI FT232R';
  if (vendorId === 0x303a) return 'Espressif Native USB JTAG/OTG';
  if (vendorId === 0x2341) return 'Arduino Official (Atmega16U2/SAMD)';
  if (vendorId === 0x2a03) return 'Arduino.org';
  if (vendorId === 0x067b) return 'Prolific PL2303';
  if (vendorId === 0x2e8a) return 'Raspberry Pi Pico / RP2040';
  
  return `Generic USB Serial (0x${vendorId.toString(16).padStart(4, '0')})`;
}
