import { FLAGS } from '../config/BuildFlags';

const KEY = 'mole.v1';

export interface SaveData {
  highestUnlockedLevel: number;
  lives: number;
  muted: boolean;
  perLevelStars: Record<number, number>;
  totalStars: number;
}

const defaults = (): SaveData => ({
  highestUnlockedLevel: 1,
  lives: FLAGS.startingLives,
  muted: false,
  perLevelStars: {},
  totalStars: 0,
});

let cache: SaveData | null = null;

function read(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    cache = defaults();
  }
  return cache!;
}

function write(): void {
  if (!cache) return;
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
}

export const Save = {
  get(): SaveData { return read(); },

  setLives(n: number): void {
    const d = read();
    d.lives = Math.max(0, Math.min(FLAGS.maxLives, n));
    write();
  },
  addLife(delta = 1): void { this.setLives(read().lives + delta); },
  loseLife(): void { this.setLives(read().lives - 1); },

  unlockUpTo(level: number): void {
    const d = read();
    if (level > d.highestUnlockedLevel) { d.highestUnlockedLevel = Math.min(FLAGS.totalLevels, level); write(); }
  },

  recordStars(level: number, stars: number): void {
    const d = read();
    const prev = d.perLevelStars[level] ?? 0;
    if (stars > prev) {
      d.perLevelStars[level] = stars;
      d.totalStars += stars - prev;
      write();
    }
  },

  setMuted(m: boolean): void { const d = read(); d.muted = m; write(); },

  reset(): void { cache = defaults(); write(); },
};
