/**
 * Lightweight Web Audio API Synthesizer for tactile, interactive hardware UI feedback.
 * No external sound files or network requests needed.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('esi_sound_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('esi_sound_enabled', String(val));
    }
    if (val) {
      this.playTone(800, 0.05, 'sine', 0.08);
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public click() {
    this.playTone(1200, 0.03, 'sine', 0.05);
  }

  public select() {
    this.playTone(880, 0.06, 'triangle', 0.07);
  }

  public connect() {
    if (!this.enabled) return;
    this.playTone(523.25, 0.08, 'sine', 0.09); // C5
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.09), 80); // E5
    setTimeout(() => this.playTone(783.99, 0.16, 'sine', 0.1), 160); // G5
  }

  public disconnect() {
    if (!this.enabled) return;
    this.playTone(783.99, 0.08, 'sine', 0.08);
    setTimeout(() => this.playTone(523.25, 0.14, 'sine', 0.08), 90);
  }

  public flashSuccess() {
    if (!this.enabled) return;
    this.playTone(587.33, 0.1, 'sine', 0.1); // D5
    setTimeout(() => this.playTone(739.99, 0.12, 'sine', 0.1), 90); // F#5
    setTimeout(() => this.playTone(880.00, 0.14, 'sine', 0.12), 180); // A5
    setTimeout(() => this.playTone(1174.66, 0.35, 'triangle', 0.15), 270); // D6
  }

  public error() {
    if (!this.enabled) return;
    this.playTone(220, 0.12, 'sawtooth', 0.08);
    setTimeout(() => this.playTone(180, 0.2, 'sawtooth', 0.08), 120);
  }

  public adminUnlock() {
    if (!this.enabled) return;
    this.playTone(440, 0.06, 'sine', 0.08);
    setTimeout(() => this.playTone(880, 0.12, 'sine', 0.1), 70);
    setTimeout(() => this.playTone(1320, 0.18, 'triangle', 0.12), 140);
  }
}

export const soundEffects = new SoundManager();
