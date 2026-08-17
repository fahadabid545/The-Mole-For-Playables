import { FLAGS } from '../config/BuildFlags';
import type { Lang } from './I18nService';
import type { ConsumableKind } from '../config/ConsumableConfig';
import type { Category } from '../config/CategoryConfig';
import { CATEGORY_DEFS } from '../config/CategoryConfig';

const KEY = 'mole.v1';
const SCHEMA_VERSION = 3;
const LIVES_REGEN_MS = 10 * 60 * 1000;

export type ConsumableInventory = Partial<Record<ConsumableKind, number>>;

export interface GameStats {
  raccoonsHit: number;
  goldensHit: number;
  bossesHit: number;
  bombsHit: number;
  frozenHit: number;
  catsHit: number;
  goatsHit: number;
  escapes: number;
  bestCombo: number;
  totalGamesPlayed: number;
}

export interface CategoryProgress {
  highestUnlockedLevel: number;
  perLevelStars: Record<number, number>;
  totalStars: number;
}

export interface SaveData {
  highestUnlockedLevel: number;
  lives: number;
  livesRegenAt?: number;
  muted: boolean;
  sfxMuted?: boolean;
  musicMuted?: boolean;
  hapticDisabled?: boolean;
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
  lastStreakRewardDate?: string;
  rated?: boolean;
  ratePromptCount?: number;
  categories: Record<Category, CategoryProgress>;
  activeSkin?: string;
  ownedSkins?: string[];
  questProgress: Record<string, { progress: number; claimed: boolean }>;
  medals: number;
}

const defaultStats = (): GameStats => ({
  raccoonsHit: 0,
  goldensHit: 0,
  bossesHit: 0,
  bombsHit: 0,
  frozenHit: 0,
  catsHit: 0,
  goatsHit: 0,
  escapes: 0,
  bestCombo: 0,
  totalGamesPlayed: 0,
});

const defaultCategoryProgress = (): CategoryProgress => ({
  highestUnlockedLevel: 1,
  perLevelStars: {},
  totalStars: 0,
});

const defaultCategories = (): Record<Category, CategoryProgress> => ({
  easy: defaultCategoryProgress(),
  hard: defaultCategoryProgress(),
  superHard: defaultCategoryProgress(),
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
  categories: defaultCategories(),
  questProgress: {},
  medals: 0,
});

let cache: SaveData | null = null;

function bridgeStorage(): any {
  const b = (typeof window !== 'undefined') ? (window as any).bridge : undefined;
  return b?.storage;
}

function migrate(d: SaveData): SaveData {
  if (!d.categories) {
    d.categories = defaultCategories();
    d.categories.easy = {
      highestUnlockedLevel: d.highestUnlockedLevel || 1,
      perLevelStars: { ...(d.perLevelStars || {}) },
      totalStars: d.totalStars || 0,
    };
  }
  const s = d.stats || defaultStats();
  if (s.catsHit === undefined) s.catsHit = 0;
  if (s.goatsHit === undefined) s.goatsHit = 0;
  d.stats = s;
  if (!d.questProgress) d.questProgress = {};
  if (d.medals === undefined) d.medals = 0;
  if (!d.ownedSkins) d.ownedSkins = ['default'];
  return d;
}

function read(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? migrate({ ...defaults(), ...JSON.parse(raw) }) : defaults();
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

  getCategoryProgress(cat: Category): CategoryProgress {
    const d = read();
    if (!d.categories[cat]) d.categories[cat] = defaultCategoryProgress();
    return d.categories[cat];
  },

  unlockCategoryUpTo(cat: Category, level: number): void {
    const d = read();
    if (!d.categories[cat]) d.categories[cat] = defaultCategoryProgress();
    const cp = d.categories[cat];
    const maxLvl = CATEGORY_DEFS[cat].levels;
    if (level > cp.highestUnlockedLevel) {
      cp.highestUnlockedLevel = Math.min(maxLvl, level);
      write();
    }
  },

  recordCategoryStars(cat: Category, level: number, stars: number): void {
    const d = read();
    if (!d.categories[cat]) d.categories[cat] = defaultCategoryProgress();
    const cp = d.categories[cat];
    const prev = cp.perLevelStars[level] ?? 0;
    if (stars > prev) {
      cp.perLevelStars[level] = stars;
      cp.totalStars += stars - prev;
      d.totalStars += stars - prev;
      write();
    }
  },

  getAllStars(): number {
    const d = read();
    let total = 0;
    for (const cat of ['easy', 'hard', 'superHard'] as Category[]) {
      if (d.categories[cat]) total += d.categories[cat].totalStars;
    }
    return total;
  },

  setMuted(m: boolean): void { const d = read(); d.muted = m; write(); },
  setSfxMuted(m: boolean): void { const d = read(); d.sfxMuted = m; write(); },
  setMusicMuted(m: boolean): void { const d = read(); d.musicMuted = m; write(); },
  setHapticDisabled(v: boolean): void { const d = read(); d.hapticDisabled = v; write(); },
  isHapticDisabled(): boolean { return read().hapticDisabled ?? false; },
  markRated(): void { const d = read(); d.rated = true; write(); },
  hasRated(): boolean { return read().rated ?? false; },
  incrementRatePrompt(): number {
    const d = read();
    d.ratePromptCount = (d.ratePromptCount ?? 0) + 1;
    write();
    return d.ratePromptCount;
  },
  getRatePromptCount(): number { return read().ratePromptCount ?? 0; },

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

  recordHit(kind: 'normal' | 'golden' | 'boss' | 'bomb' | 'frozen' | 'cat' | 'goat'): void {
    const d = read();
    d.stats = d.stats || defaultStats();
    if (kind === 'normal') d.stats.raccoonsHit++;
    else if (kind === 'golden') d.stats.goldensHit++;
    else if (kind === 'boss') d.stats.bossesHit++;
    else if (kind === 'bomb') d.stats.bombsHit++;
    else if (kind === 'frozen') d.stats.frozenHit++;
    else if (kind === 'cat') d.stats.catsHit++;
    else if (kind === 'goat') d.stats.goatsHit++;
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

  claimStreakReward(): number {
    const d = read();
    const today = new Date().toISOString().slice(0, 10);
    if (d.lastStreakRewardDate === today || d.playStreak < 2) return 0;
    const reward = Math.min(d.playStreak * 5, 50);
    d.coins = (d.coins || 0) + reward;
    d.lastStreakRewardDate = today;
    write();
    return reward;
  },
  getStats(): GameStats { const d = read(); return d.stats || defaultStats(); },

  getQuestProgress(): Record<string, { progress: number; claimed: boolean }> {
    const d = read();
    return d.questProgress || {};
  },
  setQuestProgress(id: string, progress: number, claimed: boolean): void {
    const d = read();
    if (!d.questProgress) d.questProgress = {};
    d.questProgress[id] = { progress, claimed };
    write();
  },
  addMedal(): void {
    const d = read();
    d.medals = (d.medals || 0) + 1;
    write();
  },

  getActiveSkin(): string { return read().activeSkin || 'default'; },
  setActiveSkin(id: string): void {
    const d = read();
    d.activeSkin = id;
    write();
  },
  getOwnedSkins(): string[] {
    const d = read();
    return d.ownedSkins ?? ['default'];
  },
  buySkin(id: string, cost: number): boolean {
    const d = read();
    if ((d.coins || 0) < cost) return false;
    d.coins -= cost;
    if (!d.ownedSkins) d.ownedSkins = ['default'];
    if (!d.ownedSkins.includes(id)) d.ownedSkins.push(id);
    d.activeSkin = id;
    write();
    return true;
  },

  reset(): void { cache = defaults(); write(); },
};
