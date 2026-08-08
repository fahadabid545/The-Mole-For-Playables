import { getLevelParams, LevelParams } from '../config/LevelConfig';
import { FLAGS, IS_PLAYABLES } from '../config/BuildFlags';
import { Save } from './SaveService';

export type ChallengeKind = 'daily' | 'weekly';

export interface Challenge {
  kind: ChallengeKind;
  key: string;
  params: LevelParams;
  rewardLives: number;
  rewardBonus: number;
  alreadyDone: boolean;
}

function todayKey(): string { return new Date().toISOString().slice(0, 10); }
function weekKey(): string {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

// Deterministic pseudo-random from a string key
function seed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 0xffffffff;
}

export function allChallengesDone(): boolean {
  return getChallenge('daily').alreadyDone && getChallenge('weekly').alreadyDone;
}

export function getChallenge(kind: ChallengeKind): Challenge {
  const key = kind === 'daily' ? todayKey() : weekKey();
  const s = seed(kind + ':' + key);
  // Daily uses a mid-range level around 15-25; weekly is harder 30-45.
  const range = kind === 'daily' ? [12, 25] : [30, Math.min(48, FLAGS.totalLevels - 2)];
  const level = Math.max(1, Math.min(FLAGS.totalLevels, Math.floor(range[0] + s * (range[1] - range[0]))));
  const base = getLevelParams(level);
  // Challenge tightens the level a notch
  const params: LevelParams = {
    ...base,
    timeLimitMs: Math.round(base.timeLimitMs * 0.85),
    quota: Math.round(base.quota * 1.1),
  };
  // Ads are disabled in Playables, so challenge completion is the ONLY
  // way to earn extra lives there — bump the weekly reward accordingly.
  // Store builds still have rewarded ads for lives, so weekly keeps its
  // original 2-life payout.
  const rewardLives = kind === 'daily' ? 1 : (IS_PLAYABLES ? 3 : 2);
  const rewardBonus = kind === 'daily' ? 100 : 500;
  const alreadyDone = kind === 'daily'
    ? Save.get().lastDailyKey === key
    : Save.get().lastWeeklyKey === key;
  return { kind, key, params, rewardLives, rewardBonus, alreadyDone };
}
