/**
 * Browser Web Serial implementation of STK500v1 Protocol for Arduino AVR (Uno, Nano, ATmega328P)
 * Modeled on the exact timing, signaling, and packet flow of avrdude 'arduino' programmer.
 *
 * KEY FIX: The sync() loop previously called clearBuffer() before EVERY attempt,
 * discarding responses already in the buffer from a previous command.
 * It also fired multiple sync packets without waiting, flooding Optiboot's UART.
 * Optiboot's verifySpace() would then trigger a 16ms watchdog reset and exit the bootloader.
 *
 * This version:
 *  - Sends ONE GET_SYNC, waits up to 300ms for [0x14, 0x10] before trying again
 *  - Drains (clears) the RX buffer only once at the START of the whole sync sequence
 *  - Sends a small inter-command delay to match avrdude timing
 */

export const STK = {
  RESP_INSYNC: 0x14,
  RESP_OK: 0x10,
  CRC_EOP: 0x20,

  GET_SYNC: 0x30,
  GET_SIGN_ON: 0x31,
  GET_PARAMETER: 0x41,
  SET_DEVICE: 0x42,
  SET_DEVICE_EXT: 0x45,
  ENTER_PROGMODE: 0x50,
  LEAVE_PROGMODE: 0x51,
  CHIP_ERASE: 0x52,
  LOAD_ADDRESS: 0x55,
  PROG_PAGE: 0x64,
  READ_PAGE: 0x74,
  READ_SIGN: 0x75,
};

export class STK500v1 {
  private port: SerialPort;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private rxBuffer: number[] = [];
  private isReading = false;
  private readLoopPromise: Promise<void> | null = null;

  constructor(port: SerialPort) {
    this.port = port;
  }

  public async initStreams(): Promise<void> {
    if (!this.port.readable || !this.port.writable) {
      throw new Error('Serial port streams are not readable/writable.');
    }
    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.rxBuffer = [];
    this.isReading = true;
    this.readLoopPromise = this.startBackgroundReadLoop();
  }

  private async startBackgroundReadLoop(): Promise<void> {
    while (this.isReading && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value && value.length > 0) {
          for (let i = 0; i < value.length; i++) {
            this.rxBuffer.push(value[i]);
          }
        }
      } catch {
        // Stream cancelled or port closed
        break;
      }
    }
  }

  public clearBuffer(): void {
    this.rxBuffer = [];
  }

  public async closeStreams(): Promise<void> {
    this.isReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
    } catch {}

    try {
      if (this.writer) {
        await this.writer.close();
        this.writer.releaseLock();
        this.writer = null;
      }
    } catch {}

    if (this.readLoopPromise) {
      try {
        await this.readLoopPromise;
      } catch {}
      this.readLoopPromise = null;
    }
  }

  /**
   * Pulse DTR & RTS to trigger Arduino auto-reset circuit.
   * Matches the exact timing used by avrdude for Arduino Uno & Nano.
   */
  public async pulseReset(): Promise<void> {
    try {
      // Drop DTR/RTS to false first — ensures a clean falling edge
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await this.delay(50);

      // Assert DTR/RTS (falling edge on reset capacitor pulls RESET line LOW)
      await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await this.delay(100);

      // Release DTR/RTS (RESET line goes HIGH, MCU starts running)
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });

      // Wait for Optiboot to initialize its UART (takes ~50-100ms)
      // Do NOT clear the buffer here — we'll do it after the wait in sync()
      await this.delay(120);
    } catch (e) {
      console.warn('Could not pulse DTR/RTS signals:', e);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  public async readBytes(count: number, timeoutMs = 1500): Promise<Uint8Array> {
    const startTime = Date.now();
    while (this.rxBuffer.length < count) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(
          `Timeout waiting for ${count} response byte(s) from Arduino bootloader (received ${this.rxBuffer.length}).`
        );
      }
      await this.delay(5);
    }

    const chunk = this.rxBuffer.splice(0, count);
    return new Uint8Array(chunk);
  }

  public async sendCommand(cmd: number[]): Promise<void> {
    if (!this.writer) throw new Error('Writer not initialized');
    await this.writer.write(new Uint8Array(cmd));
  }

  /**
   * Synchronize with STK500v1 bootloader.
   *
   * CRITICAL FIX vs previous version:
   * - We clear the RX buffer ONCE at the top (to discard UART noise from reset)
   * - We send ONE GET_SYNC packet and wait up to 280ms for [0x14, 0x10]
   * - We do NOT clear the buffer between attempts (we scan the accumulated bytes)
   * - This matches avrdude behavior exactly and avoids flooding Optiboot
   */
  public async sync(maxAttempts = 10): Promise<boolean> {
    // Clear once: discard any UART garbage from the reset pulse
    this.clearBuffer();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sendCommand([STK.GET_SYNC, STK.CRC_EOP]);

      const startTime = Date.now();
      while (Date.now() - startTime < 280) {
        // Scan for [0x14, 0x10] anywhere in buffer
        for (let i = 0; i <= this.rxBuffer.length - 2; i++) {
          if (this.rxBuffer[i] === STK.RESP_INSYNC && this.rxBuffer[i + 1] === STK.RESP_OK) {
            // Consume all bytes up to and including the OK byte
            this.rxBuffer.splice(0, i + 2);
            return true;
          }
        }
        await this.delay(10);
      }

      // No response in 280ms. Wait a brief moment before sending the next sync.
      // This gives Optiboot time to finish processing and prevents buffer flooding.
      await this.delay(50);
    }
    return false;
  }

  public async readSignature(): Promise<string> {
    await this.sendCommand([STK.READ_SIGN, STK.CRC_EOP]);
    const resp = await this.readBytes(5); // INSYNC + 3 sign bytes + OK
    if (resp[0] !== STK.RESP_INSYNC || resp[4] !== STK.RESP_OK) {
      throw new Error('Invalid signature response from bootloader');
    }
    const sig0 = resp[1].toString(16).padStart(2, '0');
    const sig1 = resp[2].toString(16).padStart(2, '0');
    const sig2 = resp[3].toString(16).padStart(2, '0');
    return `0x${sig0} 0x${sig1} 0x${sig2}`.toUpperCase();
  }

  /**
   * Enter programming mode. Optiboot responds [0x14, 0x10].
   * If it times out (e.g. bootloader already in flash mode), we still proceed.
   */
  public async enterProgMode(): Promise<void> {
    await this.sendCommand([STK.ENTER_PROGMODE, STK.CRC_EOP]);
    const resp = await this.readBytes(2, 600);
    if (resp[0] !== STK.RESP_INSYNC || resp[1] !== STK.RESP_OK) {
      throw new Error('Failed to enter AVR programming mode');
    }
  }

  public async leaveProgMode(): Promise<void> {
    try {
      await this.sendCommand([STK.LEAVE_PROGMODE, STK.CRC_EOP]);
      await this.readBytes(2, 500);
    } catch {
      // Optiboot may not acknowledge or exits immediately
    }
  }

  /**
   * Load flash word address. Each word = 2 bytes, so byte addr >> 1 = word addr.
   * Packet: [0x55, addrLow, addrHigh, 0x20]  →  response [0x14, 0x10]
   */
  public async loadAddress(wordAddress: number): Promise<void> {
    const low = wordAddress & 0xff;
    const high = (wordAddress >> 8) & 0xff;
    await this.sendCommand([STK.LOAD_ADDRESS, low, high, STK.CRC_EOP]);
    const resp = await this.readBytes(2, 1200);
    if (resp[0] !== STK.RESP_INSYNC || resp[1] !== STK.RESP_OK) {
      throw new Error(`Failed to load flash address 0x${wordAddress.toString(16)}`);
    }
  }

  /**
   * Write a 128-byte flash page at the previously loaded address.
   * Packet: [0x64, sizeHigh, sizeLow, 0x46, ...data, 0x20]  →  response [0x14, 0x10]
   */
  public async writePage(data: Uint8Array): Promise<void> {
    const pageSize = data.length;
    const high = (pageSize >> 8) & 0xff;
    const low = pageSize & 0xff;
    const header = [STK.PROG_PAGE, high, low, 0x46]; // 'F' = Flash

    const payload = new Uint8Array(header.length + data.length + 1);
    payload.set(header, 0);
    payload.set(data, header.length);
    payload[payload.length - 1] = STK.CRC_EOP;

    if (!this.writer) throw new Error('Writer not initialized');
    await this.writer.write(payload);

    const resp = await this.readBytes(2, 3000);
    if (resp[0] !== STK.RESP_INSYNC || resp[1] !== STK.RESP_OK) {
      throw new Error('Failed to write flash page');
    }
  }
}
