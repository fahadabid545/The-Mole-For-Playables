import { Save } from './SaveService';

type SfxKind =
  | 'hit' | 'miss' | 'squeak' | 'laugh' | 'lifeLost' | 'extraLife'
  | 'win' | 'fail' | 'click' | 'bomb' | 'golden' | 'tick' | 'combo';

// Audio is synthesised via Web Audio so the shipped bundle contains
// zero audio files. Ambient jungle stacks wind + river + flute + drum +
// bird layers.
class AudioServiceImpl {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;
  private ambientStarted = false;

  init(): void {
    this.muted = Save.get().muted;
    const unlock = () => {
      if (!this.ctx) {
        try {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          this.ctx = new Ctx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = this.muted ? 0 : 0.55;
          this.masterGain.connect(this.ctx.destination);
          this.startAmbient();
        } catch { /* ignore */ }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };
    window.addEventListener('pointerdown', unlock, { once: false, passive: true });
    window.addEventListener('touchstart', unlock, { once: false, passive: true });
    window.addEventListener('keydown', unlock, { once: false, passive: true });
  }

  setMuted(m: boolean): void {
    this.muted = m;
    Save.setMuted(m);
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.55;
  }

  toggleMute(): boolean { this.setMuted(!this.muted); return this.muted; }
  isMuted(): boolean { return this.muted; }

  private startAmbient(): void {
    if (this.ambientStarted || !this.ctx || !this.masterGain) return;
    this.ambientStarted = true;
    const ctx = this.ctx;

    // wind bed
    const windBuf = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
    const wd = windBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < wd.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.015 * w) / 1.015;
      wd[i] = last * 3.5;
    }
    const wind = ctx.createBufferSource(); wind.buffer = windBuf; wind.loop = true;
    const wFilt = ctx.createBiquadFilter(); wFilt.type = 'lowpass'; wFilt.frequency.value = 380;
    const wGain = ctx.createGain(); wGain.gain.value = 0.06;
    wind.connect(wFilt).connect(wGain).connect(this.masterGain);
    wind.start();

    // river burble
    const rivBuf = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
    const rd = rivBuf.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = (Math.random() * 2 - 1) * 0.6;
    const riv = ctx.createBufferSource(); riv.buffer = rivBuf; riv.loop = true;
    const rFilt = ctx.createBiquadFilter(); rFilt.type = 'bandpass'; rFilt.frequency.value = 1400; rFilt.Q.value = 1.2;
    const rGain = ctx.createGain(); rGain.gain.value = 0.035;
    riv.connect(rFilt).connect(rGain).connect(this.masterGain);
    riv.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 200;
    lfo.connect(lfoGain).connect(rFilt.frequency);
    lfo.start();

    // pentatonic bamboo flute (C5 D5 E5 G5 A5 C6)
    const flutePool = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    let noteIdx = 0;
    const scheduleFlute = () => {
      if (!this.ctx || !this.masterGain) return;
      if (!this.muted) {
        const t = this.ctx.currentTime + 0.02;
        const freq = flutePool[noteIdx % flutePool.length];
        noteIdx += 1 + Math.floor(Math.random() * 2);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        filt.type = 'lowpass';
        filt.frequency.value = 2200;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.045, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        osc.connect(filt).connect(g).connect(this.masterGain);
        osc.start(t); osc.stop(t + 1.3);
        const oh = this.ctx.createOscillator();
        const gh = this.ctx.createGain();
        oh.type = 'sine'; oh.frequency.setValueAtTime(freq * 2, t);
        gh.gain.setValueAtTime(0.0001, t);
        gh.gain.exponentialRampToValueAtTime(0.012, t + 0.15);
        gh.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        oh.connect(gh).connect(this.masterGain);
        oh.start(t); oh.stop(t + 1.0);
      }
      setTimeout(scheduleFlute, 2200 + Math.random() * 1600);
    };
    setTimeout(scheduleFlute, 1200);

    // heartbeat-frame drum every ~4s
    const scheduleDrum = () => {
      if (!this.ctx || !this.masterGain) return;
      if (!this.muted) {
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(g).connect(this.masterGain);
        osc.start(t); osc.stop(t + 0.24);
      }
      setTimeout(scheduleDrum, 3600 + Math.random() * 900);
    };
    setTimeout(scheduleDrum, 2000);

    // Bird chirps every 2–6s. Timer chain runs even while muted so
    // unmuting resumes the ambience without re-scheduling.
    const scheduleBird = () => {
      if (!this.ctx) return;
      if (this.muted) { setTimeout(scheduleBird, 2000 + Math.random() * 4000); return; }
      const t = this.ctx.currentTime + 0.01;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const baseFreq = 1600 + Math.random() * 1200;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(g).connect(this.masterGain!);
      osc.start(t); osc.stop(t + 0.14);
      // Optional second chirp for "chirp-chirp"
      if (Math.random() < 0.6) {
        const t2 = t + 0.16;
        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(baseFreq * 1.05, t2);
        o2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t2 + 0.08);
        g2.gain.setValueAtTime(0.0001, t2);
        g2.gain.exponentialRampToValueAtTime(0.08, t2 + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.11);
        o2.connect(g2).connect(this.masterGain!);
        o2.start(t2); o2.stop(t2 + 0.13);
      }
      setTimeout(scheduleBird, 2000 + Math.random() * 4000);
    };
    setTimeout(scheduleBird, 800);
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
      osc.start(now); osc.stop(now + dur + 0.02);
    };

    const noiseBurst = (dur: number, gain = 0.4, hp = 500, lp = 4000) => {
      const bufSize = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hpF = ctx.createBiquadFilter(); hpF.type = 'highpass'; hpF.frequency.value = hp;
      const lpF = ctx.createBiquadFilter(); lpF.type = 'lowpass';  lpF.frequency.value = lp;
      const g = ctx.createGain(); g.gain.value = gain;
      src.connect(hpF).connect(lpF).connect(g).connect(this.masterGain!);
      src.start(now);
    };

    switch (kind) {
      case 'hit':
        beep(60,   0.20, 'sine',     0.55, 28);
        beep(240,  0.10, 'triangle', 0.32, 80);
        beep(2400, 0.05, 'triangle', 0.20, 1200);
        noiseBurst(0.09, 0.38, 900, 4600);
        setTimeout(() => beep(1400 + Math.random() * 400, 0.06, 'triangle', 0.14, 900), 60);
        break;
      case 'miss':
        noiseBurst(0.18, 0.25, 200, 1400);
        beep(140, 0.1, 'sine', 0.18, 80);
        break;
      case 'squeak':
        beep(1000, 0.09, 'triangle', 0.22, 1500);
        setTimeout(() => beep(1500, 0.06, 'triangle', 0.18, 1800), 60);
        break;
      case 'laugh':
        beep(650, 0.06, 'triangle', 0.22, 850);
        setTimeout(() => beep(780, 0.06, 'triangle', 0.22, 500), 80);
        setTimeout(() => beep(560, 0.08, 'triangle', 0.22, 400), 160);
        break;
      case 'lifeLost':
        beep(500, 0.09, 'sawtooth', 0.28, 220);
        setTimeout(() => beep(320, 0.16, 'sawtooth', 0.28, 100), 100);
        break;
      case 'extraLife':
        beep(660, 0.1, 'triangle', 0.3);
        setTimeout(() => beep(880, 0.1, 'triangle', 0.3), 90);
        setTimeout(() => beep(1320, 0.22, 'triangle', 0.3), 180);
        setTimeout(() => beep(1760, 0.3, 'triangle', 0.28), 300);
        break;
      case 'win': {
        const notes = [523, 659, 784, 1046, 1319];
        notes.forEach((f, i) => setTimeout(() => beep(f, 0.14, 'triangle', 0.32), i * 90));
        setTimeout(() => noiseBurst(0.3, 0.15, 3000, 8000), 400);
        break;
      }
      case 'fail':
        beep(340, 0.22, 'sawtooth', 0.28, 160);
        setTimeout(() => beep(240, 0.28, 'sawtooth', 0.28, 90), 200);
        break;
      case 'click':
        beep(1400, 0.03, 'square', 0.14);
        setTimeout(() => beep(2200, 0.02, 'square', 0.1), 30);
        break;
      case 'bomb':
        noiseBurst(0.4, 0.7, 40, 900);
        beep(60, 0.35, 'sawtooth', 0.5, 30);
        setTimeout(() => noiseBurst(0.2, 0.3, 300, 3000), 40);
        break;
      case 'golden':
        beep(880,  0.08, 'triangle', 0.3);
        setTimeout(() => beep(1320, 0.1, 'triangle', 0.3), 70);
        setTimeout(() => beep(1760, 0.14, 'triangle', 0.3), 150);
        break;
      case 'combo':
        beep(1046, 0.08, 'triangle', 0.28);
        setTimeout(() => beep(1319, 0.08, 'triangle', 0.28), 60);
        setTimeout(() => beep(1568, 0.12, 'triangle', 0.28), 120);
        break;
      case 'tick':
        beep(1000, 0.02, 'square', 0.09);
        break;
    }
  }
}

export const Audio = new AudioServiceImpl();
