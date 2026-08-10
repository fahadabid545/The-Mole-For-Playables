import { FLAGS } from '../config/BuildFlags';
import type { Lang } from './I18nService';

const KEY = 'mole.v1';
const LIVES_REGEN_MS = 10 * 60 * 1000;

export interface SaveData {
  highestUnlockedLevel: number;
  lives: number;
  livesRegenAt?: number;
  muted: boolean;
  perLevelStars: Record<number, number>;
  totalStars: number;
  lang?: Lang;
  playerName?: string;
  bestScore: number;
  welcomed: boolean;
  lastDailyKey?: string;
  lastWeeklyKey?: string;
  dailyStreak: number;
  achievements: string[];
}

const defaults = (): SaveData => ({
  highestUnlockedLevel: 1,
  lives: FLAGS.startingLives,
  muted: false,
  perLevelStars: {},
  totalStars: 0,
  bestScore: 0,
  welcomed: false,
  dailyStreak: 0,
  achievements: [],
});

let cache: SaveData | null = null;

function bridgeStorage(): any {
  const b = (typeof window !== 'undefined') ? (window as any).bridge : undefined;
  return b?.storage;
}

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
  // Fire-and-forget mirror to portal cloud storage; localStorage stays
  // the sync source of truth so game code stays synchronous.
  try { bridgeStorage()?.set?.(KEY, cache); } catch { /* ignore */ }
}

// Cloud wins when it has data so a fresh device restores prior
// progress. Must run before any Save.get() so replacing the cache is
// safe.
export async function hydrateFromBridge(): Promise<void> {
  const storage = bridgeStorage();
  if (!storage?.get) return;
  try {
    const remote = await storage.get(KEY);
    if (!remote || typeof remote !== 'object') return;
    cache = { ...defaults(), ...(remote as SaveData) };
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
  } catch { /* ignore */ }
}

export const Save = {
  get(): SaveData { return read(); },

  setLives(n: number): void {
    const d = read();
    const clamped = Math.max(0, Math.min(FLAGS.maxLives, n));
    d.lives = clamped;
    if (clamped <= 0) {
      if (!d.livesRegenAt) d.livesRegenAt = Date.now() + LIVES_REGEN_MS;
    } else {
      d.livesRegenAt = undefined;
    }
    write();
  },
  addLife(delta = 1): void { this.setLives(read().lives + delta); },
  loseLife(): void { this.setLives(read().lives - 1); },

  // Refill lives to the starting amount once the regen timer elapses,
  // but only when the caller says regen is allowed.
  tryRegenLives(canRegen: boolean): boolean {
    const d = read();
    if (d.lives > 0 || !d.livesRegenAt || !canRegen) return false;
    if (Date.now() < d.livesRegenAt) return false;
    d.lives = FLAGS.startingLives;
    d.livesRegenAt = undefined;
    write();
    return true;
  },
  livesRegenMs(): number { return LIVES_REGEN_MS; },

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

  setLang(l: Lang): void { const d = read(); d.lang = l; write(); },
  setPlayerName(n: string): void { const d = read(); d.playerName = n.slice(0, 16); write(); },
  setBestScore(n: number): void {
    const d = read();
    if (n > d.bestScore) { d.bestScore = n; write(); }
  },
  setWelcomed(): void { const d = read(); d.welcomed = true; write(); },
  markDailyDone(key: string): void {
    const d = read();
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestKey = yest.toISOString().slice(0, 10);
    d.dailyStreak = d.lastDailyKey === yestKey ? d.dailyStreak + 1 : 1;
    d.lastDailyKey = key; write();
  },
  markWeeklyDone(key: string): void { const d = read(); d.lastWeeklyKey = key; write(); },
  unlockAchievement(id: string): boolean {
    const d = read();
    d.achievements = d.achievements || [];
    if (d.achievements.includes(id)) return false;
    d.achievements.push(id); write(); return true;
  },

  reset(): void { cache = defaults(); write(); },
};
