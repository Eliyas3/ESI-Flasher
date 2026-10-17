/**
 * Browser Web Serial implementation of STK500v1 Protocol for Arduino AVR (Uno, Nano, ATmega328P)
 * Modeled on the exact timing, signaling, and packet flow of avrdude 'arduino' programmer.
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
      this.clearBuffer();
      // Drop DTR/RTS to false first
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await new Promise(r => setTimeout(r, 60));

      // Assert DTR/RTS (falling edge on reset capacitor pulls reset line LOW)
      await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await new Promise(r => setTimeout(r, 150));

      // Release DTR/RTS (pulls reset line back HIGH)
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });

      // Optiboot initializes its UART and begins listening in 50-80ms
      await new Promise(r => setTimeout(r, 60));
      this.clearBuffer();
    } catch (e) {
      console.warn('Could not pulse DTR/RTS signals:', e);
    }
  }

  public async readBytes(count: number, timeoutMs = 1500): Promise<Uint8Array> {
    const startTime = Date.now();
    while (this.rxBuffer.length < count) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(
          `Timeout waiting for ${count} response byte(s) from Arduino bootloader (received ${this.rxBuffer.length}).`
        );
      }
      await new Promise(r => setTimeout(r, 6));
    }

    const chunk = this.rxBuffer.splice(0, count);
    return new Uint8Array(chunk);
  }

  public async sendCommand(cmd: number[]): Promise<void> {
    if (!this.writer) throw new Error('Writer not initialized');
    await this.writer.write(new Uint8Array(cmd));
  }

  /**
   * Synchronize with STK500v1 bootloader (GET_SYNC).
   * Robust against noise or leading UART chatter: scans for [0x14, 0x10].
   */
  public async sync(maxAttempts = 12): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      this.clearBuffer();
      await this.sendCommand([STK.GET_SYNC, STK.CRC_EOP]);

      const startTime = Date.now();
      while (Date.now() - startTime < 160) {
        // Look for sequence [0x14, 0x10] anywhere in buffer
        for (let i = 0; i < this.rxBuffer.length - 1; i++) {
          if (this.rxBuffer[i] === STK.RESP_INSYNC && this.rxBuffer[i + 1] === STK.RESP_OK) {
            // Discard up through 0x10
            this.rxBuffer.splice(0, i + 2);
            return true;
          }
        }
        await new Promise(r => setTimeout(r, 10));
      }

      // Small breather before next sync attempt
      await new Promise(r => setTimeout(r, 40));
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

  public async enterProgMode(): Promise<void> {
    await this.sendCommand([STK.ENTER_PROGMODE, STK.CRC_EOP]);
    const resp = await this.readBytes(2, 800);
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

  public async loadAddress(wordAddress: number): Promise<void> {
    const low = wordAddress & 0xff;
    const high = (wordAddress >> 8) & 0xff;
    await this.sendCommand([STK.LOAD_ADDRESS, low, high, STK.CRC_EOP]);
    const resp = await this.readBytes(2, 800);
    if (resp[0] !== STK.RESP_INSYNC || resp[1] !== STK.RESP_OK) {
      throw new Error(`Failed to load flash address ${wordAddress}`);
    }
  }

  public async writePage(data: Uint8Array): Promise<void> {
    const pageSize = data.length;
    const high = (pageSize >> 8) & 0xff;
    const low = pageSize & 0xff;
    const cmd = [STK.PROG_PAGE, high, low, 0x46]; // 'F' for Flash

    const payload = new Uint8Array(cmd.length + data.length + 1);
    payload.set(cmd, 0);
    payload.set(data, cmd.length);
    payload[payload.length - 1] = STK.CRC_EOP;

    if (!this.writer) throw new Error('Writer not initialized');
    await this.writer.write(payload);

    const resp = await this.readBytes(2, 2000);
    if (resp[0] !== STK.RESP_INSYNC || resp[1] !== STK.RESP_OK) {
      throw new Error('Failed to write flash page');
    }
  }
}
