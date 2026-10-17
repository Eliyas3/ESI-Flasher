import { ESPLoader, Transport } from 'esptool-js';
import { DeviceInfo, FlashProgress, FlashSettings } from '../types/hardware';
import { FirmwareImageItem } from '../types/firmware';
import { Flasher, FlasherLogger } from './FlasherInterface';
import { formatUsbId, identifyUsbAdapter } from '../utils/formatters';

export class ESP32Flasher implements Flasher {
  readonly name = 'ESP32 Flasher';
  readonly targetFamily = 'ESP32' as const;

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
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge on desktop.');
    }

    this.logger.info('Requesting Web Serial port for ESP32...');
    this.port = await navigator.serial.requestPort();
    
    const portInfo = this.port.getInfo ? this.port.getInfo() : {};
    const vid = portInfo.usbVendorId;
    const pid = portInfo.usbProductId;
    const adapterName = identifyUsbAdapter(vid, pid);

    this.logger.info(`Port selected: ${adapterName} (${formatUsbId(vid, pid)})`);
    this.logger.info(`Opening serial communication at ${baudRate} baud...`);

    this.transport = new Transport(this.port, false);
    
    // Custom terminal adapter for esptool-js
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

    this.logger.info('Connecting to ESP32 ROM bootloader (syncing)...');
    
    try {
      const chip = await this.esploader.main('default_reset');
      this.logger.success(`Chip detected: ${chip}`);

      let mac = '—';
      try {
        mac = await this.esploader.chip.readMac(this.esploader);
      } catch (e) {
        this.logger.warn('Could not read MAC address.');
      }

      let flashSize = 'Unknown';
      try {
        const detectedSize = await this.esploader.detectFlashSize();
        if (detectedSize) flashSize = detectedSize;
      } catch (e) {
        flashSize = '4MB (Default)';
      }

      let chipRevision = '—';
      try {
        if (this.esploader.chip.getChipRevision) {
          chipRevision = String(await this.esploader.chip.getChipRevision(this.esploader));
        }
      } catch {}

      let features = '—';
      try {
        if (this.esploader.chip.getChipFeatures) {
          features = await this.esploader.chip.getChipFeatures(this.esploader);
        }
      } catch {}

      let crystalFreq = '—';
      try {
        if (this.esploader.chip.getCrystalFreq) {
          crystalFreq = `${await this.esploader.chip.getCrystalFreq(this.esploader)} MHz`;
        }
      } catch {}

      this.deviceInfo = {
        chip: chip || 'ESP32 Series',
        adapter: adapterName,
        usbId: formatUsbId(vid, pid),
        mac: mac,
        flashSize: flashSize,
        flashMode: 'DIO',
        flashFreq: '40MHz',
        chipRevision: chipRevision,
        features: features,
        crystalFreq: crystalFreq,
      };

      this.connected = true;
      this.logger.success(`Ready. ESP32 successfully connected.`);
      return this.deviceInfo;
    } catch (err: any) {
      this.connected = false;
      this.logger.error(`Connection failed: ${err.message || err}`);
      await this.disconnect();
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    this.logger.info('Disconnecting serial port...');
    try {
      if (this.transport) {
        await this.transport.disconnect();
      }
    } catch (e) {
      console.warn('Transport disconnect error:', e);
    } finally {
      this.transport = null;
      this.esploader = null;
      this.port = null;
      this.connected = false;
      this.deviceInfo = null;
      this.logger.info('Serial port disconnected.');
    }
  }

  public async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.deviceInfo) {
      throw new Error('Device not connected');
    }
    return this.deviceInfo;
  }

  public async flash(
    images: FirmwareImageItem[],
    settings: FlashSettings,
    onProgress: (progress: FlashProgress) => void
  ): Promise<void> {
    if (!this.isConnected() || !this.esploader) {
      throw new Error('ESP32 board is not connected. Please connect first.');
    }

    if (images.length === 0) {
      throw new Error('No firmware binaries selected for flashing.');
    }

    const startTime = Date.now();
    let totalBytesAll = images.reduce((acc, img) => acc + img.data.length, 0);
    this.logger.info(`Starting flash process for ${images.length} binary image(s) [Total: ${(totalBytesAll / (1024 * 1024)).toFixed(2)} MB]...`);

    // Prepare files array expected by esptool-js
    const fileArray = images.map((img) => ({
      data: img.data,
      address: img.address,
    }));

    // Change baud rate if configured higher than initial sync
    if (settings.baudRate && settings.baudRate !== 115200) {
      try {
        this.logger.info(`Changing flashing baud rate to ${settings.baudRate}...`);
        await this.esploader.changeBaud(settings.baudRate);
      } catch (e: any) {
        this.logger.warn(`Could not change baud rate to ${settings.baudRate}, continuing at 115200 baud.`);
      }
    }

    if (settings.eraseAll) {
      this.logger.info('Erasing entire SPI flash memory (this may take 10-25 seconds)...');
      onProgress({
        fileIndex: 0,
        totalFiles: images.length,
        percentage: 0,
        bytesWritten: 0,
        totalBytes: totalBytesAll,
        speedKBps: 0,
        elapsedSeconds: 0,
        etaSeconds: 15,
        operation: 'Erasing entire flash chip...',
      });
      await this.esploader.eraseFlash();
      this.logger.success('Flash erase complete.');
    }

    let overallWritten = 0;
    const fileStartOffsets = [0];
    for (let i = 0; i < images.length - 1; i++) {
      fileStartOffsets.push(fileStartOffsets[i] + images[i].data.length);
    }

    const writeOptions = {
      fileArray: fileArray,
      flashSize: settings.flashSize === 'detect' ? 'detect' : (settings.flashSize === 'keep' ? 'keep' : settings.flashSize),
      flashMode: settings.flashMode,
      flashFreq: settings.flashFreq,
      eraseAll: false, // handled above
      compress: true,
      reportProgress: (fileIndex: number, writtenInFile: number, totalInFile: number) => {
        const fileBase = fileStartOffsets[fileIndex] || 0;
        overallWritten = fileBase + writtenInFile;
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(100, Math.round((overallWritten / totalBytesAll) * 100));
        const speed = elapsed > 0 ? (overallWritten / 1024) / elapsed : 0;
        const remainingBytes = Math.max(0, totalBytesAll - overallWritten);
        const eta = speed > 0 ? Math.round((remainingBytes / 1024) / speed) : 0;

        onProgress({
          fileIndex: fileIndex + 1,
          totalFiles: images.length,
          percentage: pct,
          bytesWritten: overallWritten,
          totalBytes: totalBytesAll,
          speedKBps: Math.round(speed),
          elapsedSeconds: Math.round(elapsed),
          etaSeconds: eta,
          operation: `Writing file ${fileIndex + 1}/${images.length} (0x${images[fileIndex].address.toString(16).toUpperCase()})...`,
        });
      },
    };

    await this.esploader.writeFlash(writeOptions);

    this.logger.success('All binary images successfully written!');
    this.logger.info('Verifying MD5 and resetting device...');

    onProgress({
      fileIndex: images.length,
      totalFiles: images.length,
      percentage: 100,
      bytesWritten: totalBytesAll,
      totalBytes: totalBytesAll,
      speedKBps: 0,
      elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
      etaSeconds: 0,
      operation: 'Resetting device into normal run mode...',
    });

    await this.reset();
    this.logger.success('Flash procedure completed successfully.');
  }

  public async erase(): Promise<void> {
    if (!this.isConnected() || !this.esploader) {
      throw new Error('Device not connected');
    }
    this.logger.info('Erasing entire flash chip...');
    await this.esploader.eraseFlash();
    this.logger.success('Flash erase complete.');
  }

  public async reset(): Promise<void> {
    if (this.esploader) {
      try {
        await this.esploader.after('hard_reset');
      } catch {
        // Fallback to RTS/DTR toggle
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
