import { Save } from './SaveService';

type SfxKind =
  | 'hit' | 'miss' | 'squeak' | 'laugh' | 'lifeLost' | 'extraLife'
  | 'win' | 'fail' | 'click' | 'bomb' | 'golden' | 'tick';

class AudioServiceImpl {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;
  private ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  init(): void {
    this.muted = Save.get().muted;
    const unlock = () => {
      if (!this.ctx) {
        try {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          this.ctx = new Ctx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = this.muted ? 0 : 0.6;
          this.masterGain.connect(this.ctx.destination);
          this.startAmbient();
        } catch { /* ignore */ }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };
    window.addEventListener('pointerdown', unlock, { once: false, passive: true });
    window.addEventListener('touchstart', unlock, { once: false, passive: true });
  }

  setMuted(m: boolean): void {
    this.muted = m;
    Save.setMuted(m);
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.6;
  }

  toggleMute(): boolean { this.setMuted(!this.muted); return this.muted; }
  isMuted(): boolean { return this.muted; }

  private startAmbient(): void {
    if (!this.ctx || !this.masterGain) return;
    // Very quiet pink-noise-ish ambient bed (jungle breeze).
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    noise.connect(filter).connect(g).connect(this.masterGain);
    noise.start();
  }

  play(kind: SfxKind): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const beep = (freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.3, sweep?: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (sweep !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweep), now + dur);
      g.gain.setValueAtTime(gain, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g).connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    };

    const noiseBurst = (dur: number, gain = 0.4, hp = 500, lp = 4000) => {
      const bufSize = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hpF = ctx.createBiquadFilter(); hpF.type = 'highpass'; hpF.frequency.value = hp;
      const lpF = ctx.createBiquadFilter(); lpF.type = 'lowpass';  lpF.frequency.value = lp;
      const g = ctx.createGain(); g.gain.value = gain;
      src.connect(hpF).connect(lpF).connect(g).connect(this.masterGain!);
      src.start(now);
    };

    switch (kind) {
      case 'hit':
        beep(220, 0.08, 'square', 0.35, 80);
        noiseBurst(0.08, 0.4, 800, 3500);
        break;
      case 'miss':
        noiseBurst(0.15, 0.25, 300, 1500);
        break;
      case 'squeak':
        beep(900, 0.09, 'triangle', 0.25, 1400);
        break;
      case 'laugh':
        beep(600, 0.06, 'triangle', 0.25, 800);
        setTimeout(() => beep(700, 0.06, 'triangle', 0.25, 500), 80);
        setTimeout(() => beep(550, 0.08, 'triangle', 0.25, 400), 160);
        break;
      case 'lifeLost':
        beep(400, 0.18, 'sawtooth', 0.3, 100);
        break;
      case 'extraLife':
        beep(660, 0.1, 'triangle', 0.3);
        setTimeout(() => beep(880, 0.1, 'triangle', 0.3), 90);
        setTimeout(() => beep(1320, 0.18, 'triangle', 0.3), 180);
        break;
      case 'win':
        beep(523, 0.12, 'triangle', 0.35);
        setTimeout(() => beep(659, 0.12, 'triangle', 0.35), 110);
        setTimeout(() => beep(784, 0.12, 'triangle', 0.35), 220);
        setTimeout(() => beep(1046, 0.24, 'triangle', 0.35), 330);
        break;
      case 'fail':
        beep(300, 0.2, 'sawtooth', 0.3, 150);
        setTimeout(() => beep(200, 0.25, 'sawtooth', 0.3, 90), 180);
        break;
      case 'click':
        beep(1200, 0.04, 'square', 0.15);
        break;
      case 'bomb':
        noiseBurst(0.35, 0.6, 60, 900);
        beep(80, 0.3, 'sawtooth', 0.4, 40);
        break;
      case 'golden':
        beep(880, 0.08, 'triangle', 0.3);
        setTimeout(() => beep(1320, 0.1, 'triangle', 0.3), 70);
        setTimeout(() => beep(1760, 0.14, 'triangle', 0.3), 150);
        break;
      case 'tick':
        beep(1000, 0.02, 'square', 0.1);
        break;
    }
  }
}

export const Audio = new AudioServiceImpl();
