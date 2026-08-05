import { Save } from './SaveService';

type SfxKind =
  | 'hit' | 'miss' | 'squeak' | 'laugh' | 'lifeLost' | 'extraLife'
  | 'win' | 'fail' | 'click' | 'bomb' | 'golden' | 'tick' | 'combo';

// Audio is fully synthesized via the Web Audio API so the shipped
// bundle contains no audio files. Ambient jungle is three parallel
// layers (wind bed + river + bird chirps) with the bird pattern
// deterministically wandering so it never feels loopy.
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

    // Layer 1 — low-frequency wind bed (filtered noise)
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

    // Layer 2 — river burble (band-passed brighter noise)
    const rivBuf = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
    const rd = rivBuf.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = (Math.random() * 2 - 1) * 0.6;
    const riv = ctx.createBufferSource(); riv.buffer = rivBuf; riv.loop = true;
    const rFilt = ctx.createBiquadFilter(); rFilt.type = 'bandpass'; rFilt.frequency.value = 1400; rFilt.Q.value = 1.2;
    const rGain = ctx.createGain(); rGain.gain.value = 0.035;
    riv.connect(rFilt).connect(rGain).connect(this.masterGain);
    riv.start();
    // Slowly modulate river frequency for gentle burbles
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 200;
    lfo.connect(lfoGain).connect(rFilt.frequency);
    lfo.start();

    // Layer 3 — bird chirps scheduled 2–6s apart at random pitches
    const scheduleBird = () => {
      if (this.muted || !this.ctx) return;
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
        // Punchy THWACK: low body + high metallic ping + noise slap
        beep(90,  0.16, 'sine',     0.5, 40);
        beep(220, 0.08, 'square',   0.28, 80);
        beep(1800, 0.06, 'triangle', 0.22, 900);
        noiseBurst(0.08, 0.32, 900, 4200);
        break;
      case 'miss':
        // Softer dust puff plus a low bonk
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
        // Ascending major arpeggio + shimmer noise
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
