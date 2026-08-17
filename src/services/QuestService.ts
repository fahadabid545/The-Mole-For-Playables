import { Save } from './SaveService';
import { TX } from '../objects/TextureFactory';

export type QuestType =
  | 'hitRaccoons'
  | 'hitGoldens'
  | 'hitBosses'
  | 'winLevels'
  | 'earnStars'
  | 'reachCombo'
  | 'winWithoutMiss'
  | 'hitFrozen'
  | 'avoidBombs';

export interface QuestDef {
  type: QuestType;
  target: number;
  label: string;
  icon: string;
  coinReward: number;
}

export interface QuestState {
  progress: number;
  claimed: boolean;
}

export interface QuestSlot {
  def: QuestDef;
  state: QuestState;
}

function todayKey(): string { return new Date().toISOString().slice(0, 10); }
function weekKey(): string {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function seed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 0xffffffff;
}

const DAILY_POOL: QuestDef[] = [
  { type: 'hitRaccoons',    target: 30,  label: 'Hit 30 raccoons',           icon: TX.raccoon,      coinReward: 15 },
  { type: 'hitRaccoons',    target: 50,  label: 'Hit 50 raccoons',           icon: TX.raccoon,      coinReward: 25 },
  { type: 'hitGoldens',     target: 3,   label: 'Hit 3 golden raccoons',     icon: TX.raccoonGolden, coinReward: 20 },
  { type: 'hitGoldens',     target: 5,   label: 'Hit 5 golden raccoons',     icon: TX.raccoonGolden, coinReward: 30 },
  { type: 'winLevels',      target: 3,   label: 'Win 3 levels',              icon: TX.iconTrophy,   coinReward: 20 },
  { type: 'winLevels',      target: 5,   label: 'Win 5 levels',              icon: TX.iconTrophy,   coinReward: 35 },
  { type: 'earnStars',      target: 5,   label: 'Earn 5 stars',              icon: TX.star,         coinReward: 15 },
  { type: 'earnStars',      target: 9,   label: 'Earn 9 stars',              icon: TX.star,         coinReward: 25 },
  { type: 'reachCombo',     target: 5,   label: 'Reach a 5-combo',           icon: TX.iconFlame,    coinReward: 15 },
  { type: 'reachCombo',     target: 8,   label: 'Reach an 8-combo',          icon: TX.iconFlame,    coinReward: 25 },
  { type: 'winWithoutMiss', target: 1,   label: 'Win a level with 0 misses', icon: TX.iconShield,   coinReward: 30 },
  { type: 'hitFrozen',      target: 3,   label: 'Hit 3 frozen raccoons',     icon: TX.raccoonFrozen, coinReward: 20 },
  { type: 'avoidBombs',     target: 3,   label: 'Win 3 levels, 0 bombs hit', icon: TX.bomb,         coinReward: 25 },
];

const WEEKLY_POOL: QuestDef[] = [
  { type: 'hitRaccoons',    target: 200, label: 'Hit 200 raccoons',           icon: TX.raccoon,      coinReward: 80 },
  { type: 'hitGoldens',     target: 15,  label: 'Hit 15 golden raccoons',     icon: TX.raccoonGolden, coinReward: 60 },
  { type: 'hitBosses',      target: 3,   label: 'Defeat 3 bosses',            icon: TX.raccoonBoss,  coinReward: 75 },
  { type: 'winLevels',      target: 15,  label: 'Win 15 levels',              icon: TX.iconTrophy,   coinReward: 100 },
  { type: 'earnStars',      target: 30,  label: 'Earn 30 stars',              icon: TX.star,         coinReward: 80 },
  { type: 'reachCombo',     target: 10,  label: 'Reach a 10-combo',           icon: TX.iconFlame,    coinReward: 50 },
  { type: 'winWithoutMiss', target: 3,   label: 'Win 3 levels with 0 misses', icon: TX.iconShield,   coinReward: 75 },
  { type: 'hitFrozen',      target: 10,  label: 'Hit 10 frozen raccoons',     icon: TX.raccoonFrozen, coinReward: 50 },
];

function pickN<T>(pool: T[], n: number, s: number): T[] {
  const indices = pool.map((_, i) => i);
  const out: T[] = [];
  for (let k = 0; k < n && indices.length > 0; k++) {
    const pick = Math.floor(((s * (k + 1) * 7919) % 1000) / 1000 * indices.length);
    out.push(pool[indices[pick]]);
    indices.splice(pick, 1);
  }
  return out;
}

export function getDailyQuests(): QuestSlot[] {
  const key = todayKey();
  const s = seed('daily-quest:' + key);
  const defs = pickN(DAILY_POOL, 3, s);
  const saved = Save.getQuestProgress();
  return defs.map((def, i) => {
    const id = `d:${key}:${i}`;
    const state = saved[id] ?? { progress: 0, claimed: false };
    return { def, state };
  });
}

export function getWeeklyQuests(): QuestSlot[] {
  const key = weekKey();
  const s = seed('weekly-quest:' + key);
  const defs = pickN(WEEKLY_POOL, 2, s);
  const saved = Save.getQuestProgress();
  return defs.map((def, i) => {
    const id = `w:${key}:${i}`;
    const state = saved[id] ?? { progress: 0, claimed: false };
    return { def, state };
  });
}

export function getAllQuests(): QuestSlot[] {
  return [...getDailyQuests(), ...getWeeklyQuests()];
}

function questId(kind: 'daily' | 'weekly', index: number): string {
  const key = kind === 'daily' ? todayKey() : weekKey();
  const prefix = kind === 'daily' ? 'd' : 'w';
  return `${prefix}:${key}:${index}`;
}

export interface LevelResult {
  raccoonsHit: number;
  goldensHit: number;
  bossesHit: number;
  frozenHit: number;
  bombsHit: number;
  starsEarned: number;
  maxCombo: number;
  misses: number;
  won: boolean;
}

export function recordQuestProgress(result: LevelResult): string[] {
  const completed: string[] = [];

  const process = (quests: QuestSlot[], kind: 'daily' | 'weekly') => {
    quests.forEach((slot, i) => {
      if (slot.state.claimed) return;
      const id = questId(kind, i);
      let delta = 0;

      switch (slot.def.type) {
        case 'hitRaccoons':    delta = result.raccoonsHit + result.goldensHit; break;
        case 'hitGoldens':     delta = result.goldensHit; break;
        case 'hitBosses':      delta = result.bossesHit; break;
        case 'hitFrozen':      delta = result.frozenHit; break;
        case 'winLevels':      delta = result.won ? 1 : 0; break;
        case 'earnStars':      delta = result.starsEarned; break;
        case 'reachCombo':
          if (result.maxCombo >= slot.def.target) delta = slot.def.target;
          break;
        case 'winWithoutMiss':
          if (result.won && result.misses === 0) delta = 1;
          break;
        case 'avoidBombs':
          if (result.won && result.bombsHit === 0) delta = 1;
          break;
      }

      if (delta > 0) {
        const newProgress = Math.min(slot.def.target, slot.state.progress + delta);
        Save.setQuestProgress(id, newProgress, false);
        slot.state.progress = newProgress;
        if (newProgress >= slot.def.target) {
          completed.push(slot.def.label);
        }
      }
    });
  };

  process(getDailyQuests(), 'daily');
  process(getWeeklyQuests(), 'weekly');

  return completed;
}

export function claimQuest(kind: 'daily' | 'weekly', index: number): number {
  const id = questId(kind, index);
  const quests = kind === 'daily' ? getDailyQuests() : getWeeklyQuests();
  const slot = quests[index];
  if (!slot || slot.state.claimed || slot.state.progress < slot.def.target) return 0;
  Save.setQuestProgress(id, slot.state.progress, true);
  Save.addCoins(slot.def.coinReward);
  Save.addMedal();
  return slot.def.coinReward;
}

export function getUnclaimedCount(): number {
  return getAllQuests().filter(q => q.state.progress >= q.def.target && !q.state.claimed).length;
}

export function getTotalMedals(): number {
  return Save.get().medals ?? 0;
}
