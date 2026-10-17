/**
 * Browser Web Serial implementation of STK500v1 Protocol for Arduino AVR (Uno, Nano, ATmega328P)
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
  }

  public async closeStreams(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
    } catch {
      // ignore stream close errors
    }
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer.releaseLock();
        this.writer = null;
      }
    } catch {
      // ignore
    }
  }

  /**
   * Pulse DTR and RTS to trigger the Arduino hardware auto-reset circuit
   */
  public async pulseReset(): Promise<void> {
    try {
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await new Promise(r => setTimeout(r, 100));
      await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await new Promise(r => setTimeout(r, 100));
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      // Allow bootloader to start listening
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      console.warn('Could not pulse DTR/RTS:', e);
    }
  }

  private async readBytes(count: number, timeoutMs = 1500): Promise<Uint8Array> {
    const startTime = Date.now();
    while (this.rxBuffer.length < count) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Timeout waiting for ${count} response bytes from bootloader (received ${this.rxBuffer.length}).`);
      }

      if (!this.reader) throw new Error('Reader not initialized');
      
      const readPromise = this.reader.read();
      const timerPromise = new Promise<{ value: undefined; done: boolean }>(r => setTimeout(() => r({ value: undefined, done: false }), 200));
      const res = await Promise.race([readPromise, timerPromise]);

      if (res && res.value) {
        for (let i = 0; i < res.value.length; i++) {
          this.rxBuffer.push(res.value[i]);
        }
      }
    }

    const chunk = this.rxBuffer.splice(0, count);
    return new Uint8Array(chunk);
  }

  public async sendCommand(cmd: number[]): Promise<void> {
    if (!this.writer) throw new Error('Writer not initialized');
    await this.writer.write(new Uint8Array(cmd));
  }

  /**
   * Sync with bootloader (GET_SYNC)
   */
  public async sync(maxAttempts = 5): Promise<boolean> {
    this.rxBuffer = [];
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.sendCommand([STK.GET_SYNC, STK.CRC_EOP]);
        const resp = await this.readBytes(2, 600);
        if (resp[0] === STK.RESP_INSYNC && resp[1] === STK.RESP_OK) {
          return true;
        }
      } catch {
        // Retry
        await new Promise(r => setTimeout(r, 80));
      }
    }
    return false;
  }

  public async readSignature(): Promise<string> {
    await this.sendCommand([STK.READ_SIGN, STK.CRC_EOP]);
    const resp = await this.readBytes(5); // INSYNC + 3 sign bytes + OK
    if (resp[0] !== STK.RESP_INSYNC || resp[4] !== STK.RESP_OK) {
      throw new Error('Invalid signature response');
    }
    const sig0 = resp[1].toString(16).padStart(2, '0');
    const sig1 = resp[2].toString(16).padStart(2, '0');
    const sig2 = resp[3].toString(16).padStart(2, '0');
    return `0x${sig0} 0x${sig1} 0x${sig2}`.toUpperCase();
  }

  public async enterProgMode(): Promise<void> {
    await this.sendCommand([STK.ENTER_PROGMODE, STK.CRC_EOP]);
    const resp = await this.readBytes(2);
    if (resp[0] !== STK.RESP_INSYNC || resp[1] !== STK.RESP_OK) {
      throw new Error('Failed to enter AVR programming mode');
    }
  }

  public async leaveProgMode(): Promise<void> {
    try {
      await this.sendCommand([STK.LEAVE_PROGMODE, STK.CRC_EOP]);
      await this.readBytes(2, 500);
    } catch {
      // ignore
    }
  }

  public async loadAddress(wordAddress: number): Promise<void> {
    const low = wordAddress & 0xff;
    const high = (wordAddress >> 8) & 0xff;
    await this.sendCommand([STK.LOAD_ADDRESS, low, high, STK.CRC_EOP]);
    const resp = await this.readBytes(2);
    if (resp[0] !== STK.RESP_INSYNC || resp[1] !== STK.RESP_OK) {
      throw new Error(`Failed to load address ${wordAddress}`);
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
