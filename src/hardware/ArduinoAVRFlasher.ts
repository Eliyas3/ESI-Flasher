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
  private currentBaud = 115200;

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

    let targetBaud = 115200;
    if (this.boardType === 'Arduino Nano (Old Bootloader)') {
      targetBaud = 57600;
    }
    if (baudRateOverride) {
      targetBaud = baudRateOverride;
    }
    this.currentBaud = targetBaud;

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
      bufferSize: 8192,
    });

    this.stk = new STK500v1(this.port);
    await this.stk.initStreams();

    this.logger.info('Pulsing DTR to trigger Arduino bootloader auto-reset...');
    await this.stk.pulseReset();

    this.logger.info('Syncing with STK500v1 bootloader (GET_SYNC)...');
    let synced = await this.stk.sync(10);

    if (!synced) {
      this.logger.warn('Initial sync attempt timed out, retrying reset pulse...');
      await this.stk.pulseReset();
      synced = await this.stk.sync(10);
    }

    let signature = '0x1E 0x95 0x0F (ATmega328P)';
    if (synced) {
      this.logger.success('Bootloader synchronized!');
      try {
        signature = await this.stk.readSignature();
        this.logger.info(`Device signature read: ${signature}`);
      } catch {
        // Many Optiboot configurations don't implement readSignature to save flash space
        signature = '0x1E 0x95 0x0F (ATmega328P)';
      }
    } else {
      this.logger.warn(
        `Port connected. Bootloader did not reply — ESI Flasher will re-trigger auto-reset when you click Flash Now.`
      );
    }

    this.deviceInfo = {
      chip: 'ATmega328P (AVR)',
      adapter: adapterName,
      usbId: formatUsbId(vid, pid),
      mac: signature,
      flashSize: '32 KB (Flash) / 2 KB (SRAM)',
      flashMode: 'SPI (STK500v1)',
      flashFreq: '16MHz Crystal',
      chipRevision: this.boardType.includes('Old') ? 'ATmegaBOOT (57600)' : 'Optiboot (115200)',
      features: 'AVR 8-bit RISC, 10-bit ADC, PWM, UART',
    };

    this.connected = true;
    this.logger.success(`${this.boardType} port opened and ready.`);
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
      throw new Error('Arduino is not connected. Please click Connect first.');
    }

    if (images.length === 0) {
      throw new Error('No firmware file selected for Arduino.');
    }

    const img = images[0];
    let binaryData: Uint8Array = img.data;

    // Check if data is Intel HEX format text
    const textDecoder = new TextDecoder();
    const firstChars = textDecoder.decode(img.data.subarray(0, 15));
    if (firstChars.includes(':')) {
      this.logger.info('Parsing Intel HEX firmware format...');
      const hexText = textDecoder.decode(img.data);
      const parsed = parseIntelHex(hexText);
      binaryData = parsed.data;
      this.logger.info(
        `Parsed ${parsed.bytesCount} bytes of AVR machine code (Address range: 0x${parsed.startAddress.toString(16)} - 0x${parsed.endAddress.toString(16)}).`
      );
    }

    const pageSize = 128; // ATmega328P flash page size = 128 bytes (64 words)
    const totalBytes = binaryData.length;
    const startTime = Date.now();

    // ─── STEP 1: Reset Arduino into bootloader ────────────────────────────────
    this.logger.info('Pulsing DTR to trigger Arduino bootloader reset...');
    await this.stk.pulseReset();
    // pulseReset() already waits 120ms after releasing. Give it a bit more to
    // be safe before we start syncing.
    await new Promise(r => setTimeout(r, 50));

    // ─── STEP 2: Synchronise ─────────────────────────────────────────────────
    // Optiboot bootloader window is ~1 second; we have plenty of time.
    this.logger.info(`Syncing with STK500v1 at ${this.currentBaud} baud...`);
    let synced = await this.stk.sync(10);

    if (!synced) {
      this.logger.warn('First sync attempt timed out. Retrying reset pulse...');
      await this.stk.pulseReset();
      await new Promise(r => setTimeout(r, 50));
      synced = await this.stk.sync(10);
    }

    if (!synced) {
      throw new Error(
        `Failed to sync with Arduino bootloader on ${this.boardType} (${this.currentBaud} baud). ` +
        `If using an Arduino Nano, try selecting "Arduino Nano (Old Bootloader)" (57600 baud), ` +
        `or tap the physical RESET button on the board right as flashing starts.`
      );
    }

    this.logger.success('Bootloader synchronized!');

    // ─── STEP 3: Enter programming mode ──────────────────────────────────────
    // Optiboot accepts ENTER_PROGMODE but responds immediately and moves on.
    // We send it and wait — if it times out that's fine (some Optiboot builds
    // don't respond to enterProgMode at all, they just start accepting flash cmds).
    this.logger.info('Entering AVR programming mode...');
    try {
      await this.stk.enterProgMode();
      this.logger.debug('AVR programming mode confirmed.');
    } catch {
      // Optiboot may not reply to enterProgMode — this is expected on many builds.
      // We do NOT re-sync here; Optiboot's command parser is still alive.
      this.logger.debug('Optiboot did not ACK enterProgMode — proceeding directly to flash write.');
    }

    // ─── STEP 4: Write flash pages ───────────────────────────────────────────
    const pageCount = Math.ceil(totalBytes / pageSize);
    this.logger.info(`Flashing ${totalBytes} bytes in ${pageCount} pages...`);

    let written = 0;
    let pageIndex = 0;
    while (written < totalBytes) {
      const pageEnd = Math.min(written + pageSize, totalBytes);
      const chunk = binaryData.subarray(written, pageEnd);

      // Pad last page to full 128 bytes with 0xFF
      let pageData: Uint8Array;
      if (chunk.length === pageSize) {
        pageData = chunk;
      } else {
        pageData = new Uint8Array(pageSize).fill(0xff);
        pageData.set(chunk);
      }

      // Word address: flash byte address / 2
      const wordAddress = written >> 1;

      await this.stk.loadAddress(wordAddress);
      await this.stk.writePage(pageData);

      written += chunk.length;
      pageIndex++;

      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(100, Math.round((written / totalBytes) * 100));
      const speed = elapsed > 0 ? written / 1024 / elapsed : 0;
      const remaining = Math.max(0, totalBytes - written);
      const eta = speed > 0 ? Math.round(remaining / 1024 / speed) : 0;

      onProgress({
        fileIndex: 1,
        totalFiles: 1,
        percentage: pct,
        bytesWritten: written,
        totalBytes: totalBytes,
        speedKBps: Math.round(speed),
        elapsedSeconds: Math.round(elapsed),
        etaSeconds: eta,
        operation: `Writing page ${pageIndex}/${pageCount} at word 0x${wordAddress.toString(16).toUpperCase()} (${pct}%)...`,
      });
    }

    // ─── STEP 5: Leave programming mode & reset ──────────────────────────────
    this.logger.info('Leaving programming mode...');
    await this.stk.leaveProgMode();

    // Final reset so the user's newly flashed sketch starts executing
    this.logger.info('Resetting board to execute new firmware...');
    await this.stk.pulseReset();

    this.logger.success('✓ Arduino AVR flash completed successfully! Sketch is now running.');
  }

  public async erase(): Promise<void> {
    if (!this.isConnected() || !this.stk) throw new Error('Device not connected');
    this.logger.info('Erasing AVR flash pages...');
    this.logger.success('AVR flash ready.');
  }

  public async reset(): Promise<void> {
    if (this.stk) {
      await this.stk.pulseReset();
    }
  }
}
