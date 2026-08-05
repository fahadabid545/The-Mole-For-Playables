import { FLAGS } from './BuildFlags';

export interface LevelParams {
  level: number;
  quota: number;
  timeLimitMs: number;
  popupVisibleMs: number;
  popupIntervalMs: number;
  simultaneousMax: number;
  bombChance: number;
  goldenChance: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

export function getLevelParams(level: number): LevelParams {
  const l = Math.max(1, Math.min(FLAGS.totalLevels, level));
  const t = (l - 1) / (FLAGS.totalLevels - 1);

  const quota = Math.round(lerp(5, 55, t));
  const timeLimitMs = Math.round(lerp(45000, 28000, t));
  const popupVisibleMs = Math.round(lerp(1600, 500, t));
  const popupIntervalMs = Math.round(lerp(900, 350, t));
  const simultaneousMax = l < 11 ? 1 : l < 31 ? 2 : 3;

  const bombChance = l < FLAGS.bombsFromLevel ? 0 : lerp(0.05, 0.18, (l - FLAGS.bombsFromLevel) / (FLAGS.totalLevels - FLAGS.bombsFromLevel));
  const goldenChance = l < FLAGS.goldenRaccoonFromLevel ? 0 : lerp(0.04, 0.12, (l - FLAGS.goldenRaccoonFromLevel) / (FLAGS.totalLevels - FLAGS.goldenRaccoonFromLevel));

  return { level: l, quota, timeLimitMs, popupVisibleMs, popupIntervalMs, simultaneousMax, bombChance, goldenChance };
}
