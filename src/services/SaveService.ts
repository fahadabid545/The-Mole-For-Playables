import { FLAGS } from '../config/BuildFlags';
import type { Lang } from './I18nService';
import type { CategoryId } from '../config/Theme';

const KEY_V1 = 'mole.v1';
const KEY = 'mole.v2';
const LIVES_REGEN_MS = 10 * 60 * 1000;

export type EnemyStatKey =
  | 'raccoon' | 'boss' | 'golden' | 'frozen'
  | 'bomb' | 'cat' | 'goat';

export interface CategoryProgress {
  highestUnlockedLevel: number;
  perLevelStars: Record<number, number>;
  totalStars: number;
}

export interface Stats {
  hits: Record<EnemyStatKey, number>;
  escapes: number;
  misses: number;
  bestCombo: number;
  totalPlayMs: number;
  levelsCleared: number;
  bossesDefeated: number;
}

export interface DailyStreak {
  current: number;
  longest: number;
  lastDay?: string;
}

export interface SaveData {
  version: 2;
  lives: number;
  livesRegenAt?: number;
  muted: boolean;
  lang?: Lang;
  playerName?: string;
  bestScore: number;
  welcomed: boolean;
  lastDailyKey?: string;
  lastWeeklyKey?: string;
  challengeStreak: number;
  achievements: string[];
  medals: string[];
  categories: Record<CategoryId, CategoryProgress>;
  stats: Stats;
  playStreak: DailyStreak;
  lastPlayedCategory?: CategoryId;
  lastPlayedLevel?: number;
}

function defaultCategory(): CategoryProgress {
  return { highestUnlockedLevel: 1, perLevelStars: {}, totalStars: 0 };
}

function defaultStats(): Stats {
  return {
    hits: { raccoon: 0, boss: 0, golden: 0, frozen: 0, bomb: 0, cat: 0, goat: 0 },
    escapes: 0,
    misses: 0,
    bestCombo: 0,
    totalPlayMs: 0,
    levelsCleared: 0,
    bossesDefeated: 0,
  };
}

const defaults = (): SaveData => ({
  version: 2,
  lives: FLAGS.startingLives,
  muted: false,
  bestScore: 0,
  welcomed: false,
  challengeStreak: 0,
  achievements: [],
  medals: [],
  categories: {
    easy: defaultCategory(),
    hard: defaultCategory(),
    superHard: defaultCategory(),
  },
  stats: defaultStats(),
  playStreak: { current: 0, longest: 0 },
});

let cache: SaveData | null = null;

function bridgeStorage(): any {
  const b = (typeof window !== 'undefined') ? (window as any).bridge : undefined;
  return b?.storage;
}

// Merge remote/local data into the defaults so old snapshots pick up
// new fields automatically. Nested objects also fall back to defaults.
function hydrate(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return defaults();
  const base = defaults();
  const r = raw as Partial<SaveData> & Record<string, unknown>;
  const merged: SaveData = { ...base, ...(r as object) } as SaveData;
  merged.categories = {
    easy:      { ...base.categories.easy,      ...(r.categories?.easy      ?? {}) },
    hard:      { ...base.categories.hard,      ...(r.categories?.hard      ?? {}) },
    superHard: { ...base.categories.superHard, ...(r.categories?.superHard ?? {}) },
  };
  merged.stats = {
    ...base.stats,
    ...(r.stats ?? {}),
    hits: { ...base.stats.hits, ...(r.stats?.hits ?? {}) },
  };
  merged.playStreak = { ...base.playStreak, ...(r.playStreak ?? {}) };
  return merged;
}

// One-shot upgrade from mole.v1 → mole.v2. Preserves lives, mute,
// name, best score, welcomed, daily/weekly keys, and moves the flat
// unlocked/perLevelStars into categories.easy.
function migrateV1(v1: any): SaveData {
  const base = defaults();
  const easy: CategoryProgress = {
    highestUnlockedLevel: Number(v1.highestUnlockedLevel ?? 1),
    perLevelStars: (v1.perLevelStars && typeof v1.perLevelStars === 'object') ? v1.perLevelStars : {},
    totalStars: Number(v1.totalStars ?? 0),
  };
  return {
    ...base,
    lives: Number(v1.lives ?? base.lives),
    livesRegenAt: v1.livesRegenAt,
    muted: !!v1.muted,
    lang: v1.lang,
    playerName: v1.playerName,
    bestScore: Number(v1.bestScore ?? 0),
    welcomed: !!v1.welcomed,
    lastDailyKey: v1.lastDailyKey,
    lastWeeklyKey: v1.lastWeeklyKey,
    challengeStreak: Number(v1.dailyStreak ?? 0),
    achievements: Array.isArray(v1.achievements) ? v1.achievements : [],
    categories: { ...base.categories, easy },
  };
}

function loadFromLocal(): SaveData {
  try {
    const v2 = localStorage.getItem(KEY);
    if (v2) return hydrate(JSON.parse(v2));
    const v1 = localStorage.getItem(KEY_V1);
    if (v1) {
      const migrated = migrateV1(JSON.parse(v1));
      try { localStorage.setItem(KEY, JSON.stringify(migrated)); } catch { /* ignore */ }
      return migrated;
    }
  } catch { /* ignore */ }
  return defaults();
}

function read(): SaveData {
  if (cache) return cache;
  cache = loadFromLocal();
  return cache;
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
    // Prefer v2 in the cloud; fall back to migrating a v1 snapshot.
    const v2remote = await storage.get(KEY);
    if (v2remote && typeof v2remote === 'object') {
      cache = hydrate(v2remote);
      try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
      return;
    }
    const v1remote = await storage.get(KEY_V1);
    if (v1remote && typeof v1remote === 'object') {
      cache = migrateV1(v1remote);
      try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
      // Push migrated payload back to the cloud on next write.
      write();
    }
  } catch { /* ignore */ }
}

function todayKey(): string { return new Date().toISOString().slice(0, 10); }

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

  // Category progression
  unlockUpTo(cat: CategoryId, level: number): void {
    const d = read();
    const c = d.categories[cat];
    if (level > c.highestUnlockedLevel) {
      c.highestUnlockedLevel = Math.min(FLAGS.totalLevels, level);
      write();
    }
  },
  recordStars(cat: CategoryId, level: number, stars: number): void {
    const d = read();
    const c = d.categories[cat];
    const prev = c.perLevelStars[level] ?? 0;
    if (stars > prev) {
      c.perLevelStars[level] = stars;
      c.totalStars += stars - prev;
      write();
    }
  },
  totalStarsAcross(): number {
    const d = read();
    return d.categories.easy.totalStars + d.categories.hard.totalStars + d.categories.superHard.totalStars;
  },
  markPlayed(cat: CategoryId, level: number): void {
    const d = read();
    d.lastPlayedCategory = cat;
    d.lastPlayedLevel = level;
    write();
  },

  setMuted(m: boolean): void { const d = read(); d.muted = m; write(); },
  setLang(l: Lang): void { const d = read(); d.lang = l; write(); },
  setPlayerName(n: string): void { const d = read(); d.playerName = n.slice(0, 16); write(); },
  setBestScore(n: number): void {
    const d = read();
    if (n > d.bestScore) { d.bestScore = n; write(); }
  },
  setWelcomed(): void { const d = read(); d.welcomed = true; write(); },

  // Challenge completion (kept separate from daily play streak)
  markDailyDone(key: string): void {
    const d = read();
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestKey = yest.toISOString().slice(0, 10);
    d.challengeStreak = d.lastDailyKey === yestKey ? d.challengeStreak + 1 : 1;
    d.lastDailyKey = key; write();
  },
  markWeeklyDone(key: string): void { const d = read(); d.lastWeeklyKey = key; write(); },

  // Stats
  recordHit(kind: EnemyStatKey): void {
    const d = read();
    d.stats.hits[kind] = (d.stats.hits[kind] || 0) + 1;
    write();
  },
  recordEscape(): void { const d = read(); d.stats.escapes++; write(); },
  recordMiss(): void { const d = read(); d.stats.misses++; write(); },
  recordCombo(current: number): void {
    const d = read();
    if (current > d.stats.bestCombo) { d.stats.bestCombo = current; write(); }
  },
  recordPlayMs(ms: number): void {
    if (ms <= 0) return;
    const d = read();
    d.stats.totalPlayMs += ms;
    write();
  },
  recordLevelClear(isBoss: boolean): void {
    const d = read();
    d.stats.levelsCleared++;
    if (isBoss) d.stats.bossesDefeated++;
    write();
  },

  // Daily play streak (advances at most once per calendar day)
  tickDailyPlayStreak(): void {
    const d = read();
    const today = todayKey();
    const s = d.playStreak;
    if (s.lastDay === today) return;
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestKey = yest.toISOString().slice(0, 10);
    s.current = s.lastDay === yestKey ? s.current + 1 : 1;
    if (s.current > s.longest) s.longest = s.current;
    s.lastDay = today;
    write();
  },

  unlockAchievement(id: string): boolean {
    const d = read();
    if (d.achievements.includes(id)) return false;
    d.achievements.push(id); write(); return true;
  },
  awardMedal(id: string): boolean {
    const d = read();
    if (d.medals.includes(id)) return false;
    d.medals.push(id); write(); return true;
  },

  reset(): void { cache = defaults(); write(); },
  resetStatsOnly(): void {
    const d = read();
    d.stats = defaultStats();
    d.medals = [];
    write();
  },
};
