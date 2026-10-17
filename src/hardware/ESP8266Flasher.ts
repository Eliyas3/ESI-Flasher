import { ESPLoader, Transport } from 'esptool-js';
import { DeviceInfo, FlashProgress, FlashSettings } from '../types/hardware';
import { FirmwareImageItem } from '../types/firmware';
import { Flasher, FlasherLogger } from './FlasherInterface';
import { formatUsbId, identifyUsbAdapter } from '../utils/formatters';

export class ESP8266Flasher implements Flasher {
  readonly name = 'ESP8266 Flasher';
  readonly targetFamily = 'ESP8266' as const;

  private port: SerialPort | null = null;
  private transport: any = null;
  private esploader: any = null;
  private logger: FlasherLogger;
  private deviceInfo: DeviceInfo | null = null;
  private connected = false;

  constructor(logger: FlasherLogger) {
    this.logger = logger;
  }

  public isConnected(): boolean {
    return this.connected && this.port !== null;
  }

  public getSerialPort(): SerialPort | null {
    return this.port;
  }

  public async connect(baudRate = 115200): Promise<DeviceInfo> {
    if (!navigator.serial) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge on desktop.');
    }

    this.logger.info('Requesting Web Serial port for ESP8266...');
    this.port = await navigator.serial.requestPort();
    
    const portInfo = this.port.getInfo ? this.port.getInfo() : {};
    const vid = portInfo.usbVendorId;
    const pid = portInfo.usbProductId;
    const adapterName = identifyUsbAdapter(vid, pid);

    this.logger.info(`Port selected: ${adapterName} (${formatUsbId(vid, pid)})`);
    this.logger.info(`Opening serial communication at ${baudRate} baud...`);

    this.transport = new Transport(this.port, false);
    
    const terminal = {
      clean: () => {},
      writeLine: (text: string) => this.logger.log(text.trimEnd()),
      write: (text: string) => this.logger.log(text.trimEnd()),
    };

    this.esploader = new ESPLoader({
      transport: this.transport,
      baudrate: baudRate,
      terminal: terminal,
      romBaudrate: 115200,
    });

    this.logger.info('Connecting to ESP8266 bootloader...');
    
    try {
      const chip = await this.esploader.main('default_reset');
      this.logger.success(`Chip detected: ${chip}`);

      let mac = '—';
      try {
        mac = await this.esploader.chip.readMac(this.esploader);
      } catch {
        this.logger.warn('Could not read MAC address.');
      }

      let flashSize = 'Unknown';
      try {
        const detectedSize = await this.esploader.detectFlashSize();
        if (detectedSize) flashSize = detectedSize;
      } catch {
        flashSize = '4MB (Default)';
      }

      this.deviceInfo = {
        chip: chip || 'ESP8266EX',
        adapter: adapterName,
        usbId: formatUsbId(vid, pid),
        mac: mac,
        flashSize: flashSize,
        flashMode: 'DIO',
        flashFreq: '40MHz',
      };

      this.connected = true;
      this.logger.success(`ESP8266 ready.`);
      return this.deviceInfo;
    } catch (err: any) {
      this.connected = false;
      this.logger.error(`Connection failed: ${err.message || err}`);
      await this.disconnect();
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.transport) {
        await this.transport.disconnect();
      }
    } catch (e) {
      console.warn('Disconnect error:', e);
    } finally {
      this.transport = null;
      this.esploader = null;
      this.port = null;
      this.connected = false;
      this.deviceInfo = null;
      this.logger.info('ESP8266 disconnected.');
    }
  }

  public async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.deviceInfo) throw new Error('Device not connected');
    return this.deviceInfo;
  }

  public async flash(
    images: FirmwareImageItem[],
    settings: FlashSettings,
    onProgress: (progress: FlashProgress) => void
  ): Promise<void> {
    if (!this.isConnected() || !this.esploader) {
      throw new Error('ESP8266 is not connected.');
    }

    const startTime = Date.now();
    const totalBytes = images.reduce((acc, img) => acc + img.data.length, 0);
    this.logger.info(`Flashing ESP8266 with ${images.length} binary file(s)...`);

    const fileArray = images.map((img) => ({
      data: img.data,
      address: img.address,
    }));

    if (settings.eraseAll) {
      this.logger.info('Erasing entire flash...');
      await this.esploader.eraseFlash();
      this.logger.success('Erase completed.');
    }

    const writeOptions = {
      fileArray: fileArray,
      flashSize: settings.flashSize === 'detect' ? 'detect' : settings.flashSize,
      flashMode: settings.flashMode,
      flashFreq: settings.flashFreq,
      eraseAll: false,
      compress: true,
      reportProgress: (fileIndex: number, written: number, total: number) => {
        const pct = Math.min(100, Math.round((written / total) * 100));
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (written / 1024) / elapsed : 0;
        const remaining = Math.max(0, total - written);
        const eta = speed > 0 ? Math.round((remaining / 1024) / speed) : 0;

        onProgress({
          fileIndex: fileIndex + 1,
          totalFiles: images.length,
          percentage: pct,
          bytesWritten: written,
          totalBytes: total,
          speedKBps: Math.round(speed),
          elapsedSeconds: Math.round(elapsed),
          etaSeconds: eta,
          operation: `Writing file ${fileIndex + 1}/${images.length}...`,
        });
      },
    };

    await this.esploader.writeFlash(writeOptions);
    this.logger.success('ESP8266 flash finished successfully.');
    await this.reset();
  }

  public async erase(): Promise<void> {
    if (!this.isConnected()) throw new Error('Device not connected');
    this.logger.info('Erasing flash...');
    await this.esploader.eraseFlash();
    this.logger.success('Flash erased.');
  }

  public async reset(): Promise<void> {
    if (this.esploader) {
      try {
        await this.esploader.after('hard_reset');
      } catch {
        if (this.transport) {
          await this.transport.setRTS(true);
          await this.transport.setDTR(false);
          await new Promise(r => setTimeout(r, 100));
          await this.transport.setRTS(false);
        }
      }
    }
  }
}
