import { FLAGS } from '../config/BuildFlags';
import type { Lang } from './I18nService';
import type { ConsumableKind } from '../config/ConsumableConfig';

const KEY = 'mole.v1';
const LIVES_REGEN_MS = 10 * 60 * 1000;

export type ConsumableInventory = Partial<Record<ConsumableKind, number>>;

export interface GameStats {
  raccoonsHit: number;
  goldensHit: number;
  bossesHit: number;
  bombsHit: number;
  frozenHit: number;
  escapes: number;
  bestCombo: number;
  totalGamesPlayed: number;
}

export interface SaveData {
  highestUnlockedLevel: number;
  lives: number;
  livesRegenAt?: number;
  muted: boolean;
  sfxMuted?: boolean;
  musicMuted?: boolean;
  perLevelStars: Record<number, number>;
  totalStars: number;
  lang?: Lang;
  playerName?: string;
  bestScore: number;
  welcomed: boolean;
  lastDailyKey?: string;
  lastWeeklyKey?: string;
  dailyStreak: number;
  bonusScore: number;
  coins: number;
  consumables: ConsumableInventory;
  lastMagicBoxOpen?: number;
  powerups: { freeze: number; double: number; auto: number };
  achievements: string[];
  stats: GameStats;
  lastPlayDate?: string;
  playStreak: number;
}

const defaultStats = (): GameStats => ({
  raccoonsHit: 0,
  goldensHit: 0,
  bossesHit: 0,
  bombsHit: 0,
  frozenHit: 0,
  escapes: 0,
  bestCombo: 0,
  totalGamesPlayed: 0,
});

const defaults = (): SaveData => ({
  highestUnlockedLevel: 1,
  lives: FLAGS.startingLives,
  muted: false,
  perLevelStars: {},
  totalStars: 0,
  bestScore: 0,
  welcomed: false,
  dailyStreak: 0,
  bonusScore: 0,
  coins: 0,
  consumables: {},
  powerups: { freeze: 1, double: 1, auto: 0 },
  achievements: [],
  stats: defaultStats(),
  playStreak: 0,
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
  try { bridgeStorage()?.set?.(KEY, cache); } catch { /* ignore */ }
}

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
  setSfxMuted(m: boolean): void { const d = read(); d.sfxMuted = m; write(); },
  setMusicMuted(m: boolean): void { const d = read(); d.musicMuted = m; write(); },

  setLang(l: Lang): void { const d = read(); d.lang = l; write(); },
  setPlayerName(n: string): void { const d = read(); d.playerName = n.slice(0, 16); write(); },
  setBestScore(n: number): void {
    const d = read();
    if (n > d.bestScore) { d.bestScore = n; write(); }
  },
  setWelcomed(): void { const d = read(); d.welcomed = true; write(); },
  addBonusScore(n: number): void { const d = read(); d.bonusScore += n; write(); },
  markDailyDone(key: string): void {
    const d = read();
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestKey = yest.toISOString().slice(0, 10);
    d.dailyStreak = d.lastDailyKey === yestKey ? d.dailyStreak + 1 : 1;
    d.lastDailyKey = key; write();
  },
  markWeeklyDone(key: string): void { const d = read(); d.lastWeeklyKey = key; write(); },
  addPowerup(kind: 'freeze' | 'double' | 'auto', n = 1): void {
    const d = read();
    d.powerups = d.powerups || { freeze: 0, double: 0, auto: 0 };
    d.powerups[kind] = (d.powerups[kind] || 0) + n; write();
  },
  usePowerup(kind: 'freeze' | 'double' | 'auto'): boolean {
    const d = read();
    d.powerups = d.powerups || { freeze: 0, double: 0, auto: 0 };
    if ((d.powerups[kind] || 0) <= 0) return false;
    d.powerups[kind]--; write(); return true;
  },
  unlockAchievement(id: string): boolean {
    const d = read();
    d.achievements = d.achievements || [];
    if (d.achievements.includes(id)) return false;
    d.achievements.push(id); write(); return true;
  },

  addCoins(n: number): void {
    const d = read();
    d.coins = Math.max(0, (d.coins || 0) + n);
    write();
  },
  spendCoins(n: number): boolean {
    const d = read();
    if ((d.coins || 0) < n) return false;
    d.coins -= n;
    write();
    return true;
  },

  addConsumable(kind: ConsumableKind, n = 1): void {
    const d = read();
    d.consumables = d.consumables || {};
    d.consumables[kind] = (d.consumables[kind] || 0) + n;
    write();
  },
  useConsumable(kind: ConsumableKind): boolean {
    const d = read();
    d.consumables = d.consumables || {};
    if ((d.consumables[kind] || 0) <= 0) return false;
    d.consumables[kind] = (d.consumables[kind]!) - 1;
    write();
    return true;
  },
  getConsumableCount(kind: ConsumableKind): number {
    return read().consumables?.[kind] || 0;
  },

  canOpenMagicBox(): boolean {
    const d = read();
    if (!d.lastMagicBoxOpen) return true;
    return Date.now() - d.lastMagicBoxOpen >= 24 * 60 * 60 * 1000;
  },
  markMagicBoxOpened(): void {
    const d = read();
    d.lastMagicBoxOpen = Date.now();
    write();
  },

  recordHit(kind: 'normal' | 'golden' | 'boss' | 'bomb' | 'frozen'): void {
    const d = read();
    d.stats = d.stats || defaultStats();
    if (kind === 'normal') d.stats.raccoonsHit++;
    else if (kind === 'golden') d.stats.goldensHit++;
    else if (kind === 'boss') d.stats.bossesHit++;
    else if (kind === 'bomb') d.stats.bombsHit++;
    else if (kind === 'frozen') d.stats.frozenHit++;
    write();
  },
  recordEscape(): void {
    const d = read();
    d.stats = d.stats || defaultStats();
    d.stats.escapes++;
    write();
  },
  recordCombo(combo: number): void {
    const d = read();
    d.stats = d.stats || defaultStats();
    if (combo > d.stats.bestCombo) { d.stats.bestCombo = combo; write(); }
  },
  recordGamePlayed(): void {
    const d = read();
    d.stats = d.stats || defaultStats();
    d.stats.totalGamesPlayed++;
    const today = new Date().toISOString().slice(0, 10);
    if (d.lastPlayDate !== today) {
      if (d.lastPlayDate) {
        const prev = new Date(d.lastPlayDate);
        const diff = Math.round((Date.now() - prev.getTime()) / (24 * 60 * 60 * 1000));
        d.playStreak = diff === 1 ? (d.playStreak || 0) + 1 : 1;
      } else {
        d.playStreak = 1;
      }
      d.lastPlayDate = today;
    }
    write();
  },
  getStats(): GameStats { const d = read(); return d.stats || defaultStats(); },

  reset(): void { cache = defaults(); write(); },
};
