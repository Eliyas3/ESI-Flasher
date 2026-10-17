import { DeviceInfo, FlashProgress, FlashSettings } from '../types/hardware';
import { FirmwareImageItem } from '../types/firmware';
import { Flasher, FlasherLogger } from './FlasherInterface';

export class DemoFlasher implements Flasher {
  readonly name = 'Demo Simulation Flasher';
  readonly targetFamily = 'Demo' as const;

  private connected = false;
  private logger: FlasherLogger;

  constructor(logger: FlasherLogger) {
    this.logger = logger;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getSerialPort(): SerialPort | null {
    return null;
  }

  public async connect(): Promise<DeviceInfo> {
    this.logger.warn('=== [DEMO MODE: SIMULATION RUNNING - NO HARDWARE CONNECTED] ===');
    this.logger.info('[DEMO] Simulating Web Serial handshake...');
    await new Promise(r => setTimeout(r, 600));
    this.logger.info('[DEMO] Chip detected: ESP32-WROOM-32 (Simulated)');
    this.logger.info('[DEMO] MAC Address: 30:AE:A4:07:2D:6C (Simulated)');
    this.logger.info('[DEMO] SPI Flash: 4MB Winbond 25Q32 (Simulated)');

    this.connected = true;
    return {
      chip: 'ESP32 (Demo Simulation)',
      adapter: 'Virtual Serial Port (Demo Mode)',
      usbId: 'VID: 0x10C4 / PID: 0xEA60 (Simulated)',
      mac: '30:AE:A4:07:2D:6C',
      flashSize: '4MB (Demo)',
      flashMode: 'DIO',
      flashFreq: '40MHz',
      chipRevision: 'v3.0',
      features: 'Wi-Fi, BT, Dual Core, 240MHz',
      crystalFreq: '40 MHz',
    };
  }

  public async disconnect(): Promise<void> {
    this.logger.info('[DEMO] Virtual serial port closed.');
    this.connected = false;
  }

  public async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      chip: 'ESP32 (Demo Simulation)',
      adapter: 'Virtual Serial Port',
      usbId: 'VID: 0x10C4 / PID: 0xEA60',
      mac: '30:AE:A4:07:2D:6C',
      flashSize: '4MB (Demo)',
      flashMode: 'DIO',
      flashFreq: '40MHz',
    };
  }

  public async flash(
    images: FirmwareImageItem[],
    settings: FlashSettings,
    onProgress: (progress: FlashProgress) => void
  ): Promise<void> {
    if (!this.connected) throw new Error('[DEMO] Device not connected.');
    
    this.logger.warn('=== [DEMO MODE: SIMULATING FLASH PROCEDURE] ===');
    const totalBytes = images.reduce((acc, img) => acc + img.data.length, 0) || 524288;
    const startTime = Date.now();

    if (settings.eraseAll) {
      this.logger.info('[DEMO] Simulating SPI chip erase...');
      await new Promise(r => setTimeout(r, 1000));
    }

    const steps = 25;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, 80));
      const pct = Math.round((i / steps) * 100);
      const written = Math.round((totalBytes * i) / steps);
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? (written / 1024) / elapsed : 120;
      const eta = Math.max(0, Math.round(((totalBytes - written) / 1024) / speed));

      onProgress({
        fileIndex: 1,
        totalFiles: images.length || 1,
        percentage: pct,
        bytesWritten: written,
        totalBytes: totalBytes,
        speedKBps: Math.round(speed),
        elapsedSeconds: Math.round(elapsed),
        etaSeconds: eta,
        operation: `[DEMO] Simulating flash write (${pct}%)...`,
      });

      if (i % 5 === 0) {
        this.logger.info(`[DEMO] Writing block ${i}/${steps} (${pct}%)...`);
      }
    }

    this.logger.info('[DEMO] Simulating MD5 verification: OK');
    this.logger.info('[DEMO] Resetting device...');
    await new Promise(r => setTimeout(r, 300));
    this.logger.success('[DEMO] Simulation completed successfully!');
  }

  public async erase(): Promise<void> {
    this.logger.info('[DEMO] Erasing flash...');
    await new Promise(r => setTimeout(r, 800));
    this.logger.success('[DEMO] Erase complete.');
  }

  public async reset(): Promise<void> {
    this.logger.info('[DEMO] Soft resetting virtual ESP32.');
  }
}
