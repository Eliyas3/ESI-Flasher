import { LineEnding } from '../types/serial';

export interface SerialMonitorListener {
  onData: (text: string) => void;
  onError: (error: string) => void;
  onConnectionChange: (connected: boolean) => void;
}

export class SerialMonitorManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private isReading = false;
  private isPaused = false;
  private listener: SerialMonitorListener | null = null;
  private textDecoder = new TextDecoder();
  private textEncoder = new TextEncoder();

  public setListener(listener: SerialMonitorListener) {
    this.listener = listener;
  }

  public isConnected(): boolean {
    return this.port !== null && this.isReading;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public async connect(baudRate = 115200, existingPort?: SerialPort): Promise<void> {
    if (!navigator.serial) {
      throw new Error('Web Serial API is not supported in this browser.');
    }

    try {
      this.port = existingPort || (await navigator.serial.requestPort());

      // If port is not yet open, open it
      try {
        await this.port.open({
          baudRate: baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
        });
      } catch (err: any) {
        // Port might already be open if passed from existing connection
        if (!err.message?.includes('already open')) {
          throw err;
        }
      }

      if (!this.port.readable || !this.port.writable) {
        throw new Error('Serial port streams are unavailable.');
      }

      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();
      this.isReading = true;

      this.listener?.onConnectionChange(true);
      this.startReadingLoop();
    } catch (err: any) {
      await this.disconnect();
      this.listener?.onError(err.message || String(err));
      throw err;
    }
  }

  private async startReadingLoop() {
    while (this.isReading && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) break;

        if (value && !this.isPaused) {
          const text = this.textDecoder.decode(value, { stream: true });
          this.listener?.onData(text);
        }
      } catch (err: any) {
        if (this.isReading) {
          this.listener?.onError(`Serial read error: ${err.message || err}`);
        }
        break;
      }
    }
    this.cleanup();
  }

  public async send(text: string, lineEnding: LineEnding = 'crlf'): Promise<void> {
    if (!this.writer) {
      throw new Error('Serial monitor writer is not connected.');
    }

    let payload = text;
    if (lineEnding === 'lf') payload += '\n';
    else if (lineEnding === 'cr') payload += '\r';
    else if (lineEnding === 'crlf') payload += '\r\n';

    await this.writer.write(this.textEncoder.encode(payload));
  }

  public async disconnect(): Promise<void> {
    this.isReading = false;
    await this.cleanup();
    this.listener?.onConnectionChange(false);
  }

  private async cleanup(): Promise<void> {
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

    try {
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch {}
  }
}
