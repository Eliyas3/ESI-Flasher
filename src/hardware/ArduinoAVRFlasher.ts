import { DeviceInfo, FlashProgress, FlashSettings, ArduinoBoard } from '../types/hardware';
import { FirmwareImageItem } from '../types/firmware';
import { Flasher, FlasherLogger } from './FlasherInterface';
import { STK500v1 } from '../serial/stk500';
import { parseIntelHex } from '../serial/intelHex';
import { formatUsbId, identifyUsbAdapter } from '../utils/formatters';

export class ArduinoAVRFlasher implements Flasher {
  readonly name = 'Arduino AVR Flasher';
  readonly targetFamily = 'Arduino' as const;

  private port: SerialPort | null = null;
  private stk: STK500v1 | null = null;
  private logger: FlasherLogger;
  private deviceInfo: DeviceInfo | null = null;
  private connected = false;
  private boardType: ArduinoBoard = 'Arduino Uno (ATmega328P)';

  constructor(logger: FlasherLogger, boardType: ArduinoBoard = 'Arduino Uno (ATmega328P)') {
    this.logger = logger;
    this.boardType = boardType;
  }

  public setBoardType(type: ArduinoBoard) {
    this.boardType = type;
  }

  public isConnected(): boolean {
    return this.connected && this.port !== null;
  }

  public getSerialPort(): SerialPort | null {
    return this.port;
  }

  public async connect(baudRateOverride?: number): Promise<DeviceInfo> {
    if (!navigator.serial) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge on desktop.');
    }

    if (this.boardType === 'Arduino Leonardo') {
      throw new Error(
        'Arduino Leonardo uses a 1200-baud touch CDC bootloader which dynamically changes COM ports. ' +
        'This board requires a desktop flasher or additional browser support.'
      );
    }

    if (this.boardType === 'Arduino Mega 2560') {
      throw new Error(
        'Arduino Mega 2560 utilizes the STK500v2 protocol. ' +
        'This board requires a desktop flasher or additional browser support in this version.'
      );
    }

    // Determine target baud rate based on board bootloader
    let targetBaud = 115200;
    if (this.boardType === 'Arduino Nano (Old Bootloader)') {
      targetBaud = 57600;
    }
    if (baudRateOverride) {
      targetBaud = baudRateOverride;
    }

    this.logger.info(`Requesting Web Serial port for ${this.boardType}...`);
    this.port = await navigator.serial.requestPort();

    const portInfo = this.port.getInfo ? this.port.getInfo() : {};
    const vid = portInfo.usbVendorId;
    const pid = portInfo.usbProductId;
    const adapterName = identifyUsbAdapter(vid, pid);

    this.logger.info(`Port selected: ${adapterName} (${formatUsbId(vid, pid)})`);
    this.logger.info(`Opening port at ${targetBaud} baud...`);

    await this.port.open({
      baudRate: targetBaud,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      bufferSize: 4096,
    });

    this.stk = new STK500v1(this.port);
    await this.stk.initStreams();

    this.logger.info('Pulsing DTR to trigger Arduino bootloader auto-reset...');
    await this.stk.pulseReset();

    this.logger.info('Syncing with STK500v1 bootloader (GET_SYNC)...');
    const synced = await this.stk.sync(6);

    if (!synced) {
      await this.disconnect();
      throw new Error(
        `Failed to sync with ${this.boardType} at ${targetBaud} baud. ` +
        `If using an Arduino Nano, try selecting "Arduino Nano (Old Bootloader)" (57600 baud) or press the manual Reset button when connecting.`
      );
    }

    this.logger.success('Bootloader synchronized!');

    let signature = '—';
    try {
      signature = await this.stk.readSignature();
      this.logger.info(`Device signature: ${signature}`);
    } catch (e: any) {
      this.logger.warn(`Could not read chip signature: ${e.message}`);
    }

    this.deviceInfo = {
      chip: 'ATmega328P (AVR)',
      adapter: adapterName,
      usbId: formatUsbId(vid, pid),
      mac: signature, // Display signature for AVR
      flashSize: '32 KB (Flash) / 2 KB (SRAM)',
      flashMode: 'SPI (STK500v1)',
      flashFreq: '16MHz Crystal',
      chipRevision: 'Optiboot',
      features: 'AVR 8-bit RISC, 10-bit ADC',
    };

    this.connected = true;
    this.logger.success(`${this.boardType} connected and ready.`);
    return this.deviceInfo;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.stk) {
        await this.stk.leaveProgMode();
        await this.stk.closeStreams();
      }
      if (this.port) {
        await this.port.close();
      }
    } catch (e) {
      console.warn('Error closing Arduino port:', e);
    } finally {
      this.stk = null;
      this.port = null;
      this.connected = false;
      this.deviceInfo = null;
      this.logger.info('Arduino disconnected.');
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
    if (!this.isConnected() || !this.stk) {
      throw new Error('Arduino is not connected.');
    }

    if (images.length === 0) {
      throw new Error('No firmware file selected for Arduino.');
    }

    const img = images[0];
    let binaryData: Uint8Array = img.data;

    // Check if data is Intel HEX format text
    const textDecoder = new TextDecoder();
    const firstChars = textDecoder.decode(img.data.subarray(0, 10));
    if (firstChars.includes(':')) {
      this.logger.info('Parsing Intel HEX firmware format...');
      const hexText = textDecoder.decode(img.data);
      const parsed = parseIntelHex(hexText);
      binaryData = parsed.data;
      this.logger.info(`Parsed ${parsed.bytesCount} bytes of code (Address: 0x${parsed.startAddress.toString(16)} - 0x${parsed.endAddress.toString(16)}).`);
    }

    const pageSize = 128; // ATmega328P flash page size is 128 bytes (64 words)
    const totalBytes = binaryData.length;
    const startTime = Date.now();

    this.logger.info(`Entering AVR programming mode...`);
    await this.stk.enterProgMode();

    this.logger.info(`Flashing ${totalBytes} bytes in ${Math.ceil(totalBytes / pageSize)} pages...`);

    let written = 0;
    while (written < totalBytes) {
      const pageEnd = Math.min(written + pageSize, totalBytes);
      const chunk = binaryData.subarray(written, pageEnd);
      
      // If page is not full 128 bytes, pad with 0xFF
      let pageData: Uint8Array;
      if (chunk.length === pageSize) {
        pageData = chunk;
      } else {
        pageData = new Uint8Array(pageSize);
        pageData.fill(0xff);
        pageData.set(chunk);
      }

      // Word address in flash (each word is 2 bytes)
      const wordAddress = written >> 1;
      await this.stk.loadAddress(wordAddress);
      await this.stk.writePage(pageData);

      written += chunk.length;

      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(100, Math.round((written / totalBytes) * 100));
      const speed = elapsed > 0 ? (written / 1024) / elapsed : 0;
      const remaining = Math.max(0, totalBytes - written);
      const eta = speed > 0 ? Math.round((remaining / 1024) / speed) : 0;

      onProgress({
        fileIndex: 1,
        totalFiles: 1,
        percentage: pct,
        bytesWritten: written,
        totalBytes: totalBytes,
        speedKBps: Math.round(speed),
        elapsedSeconds: Math.round(elapsed),
        etaSeconds: eta,
        operation: `Writing AVR flash (Word addr: 0x${wordAddress.toString(16).toUpperCase()})...`,
      });
    }

    this.logger.info('Exiting programming mode...');
    await this.stk.leaveProgMode();

    this.logger.success('Arduino AVR flash complete!');
    await this.reset();
  }

  public async erase(): Promise<void> {
    if (!this.isConnected() || !this.stk) throw new Error('Device not connected');
    this.logger.info('Erasing AVR flash...');
    // STK500v1 optiboot automatically erases pages on write
    this.logger.success('AVR flash ready.');
  }

  public async reset(): Promise<void> {
    if (this.stk) {
      await this.stk.pulseReset();
    }
  }
}
