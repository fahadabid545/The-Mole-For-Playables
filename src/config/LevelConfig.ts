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
  frozenChance: number;
  isBoss: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

export function getLevelParams(level: number): LevelParams {
  const l = Math.max(1, Math.min(FLAGS.totalLevels, level));
  const t = (l - 1) / (FLAGS.totalLevels - 1);
  const isBoss = l % FLAGS.bossEveryNLevels === 0;

  // Boss levels: fewer raccoons required (the boss is the point) + slightly
  // more time so the player can chip through boss HP.
  const quota = isBoss ? Math.max(3, Math.round(4 + l / 12))
                       : Math.round(lerp(5, 55, t));
  const timeLimitMs = isBoss ? Math.round(lerp(45000, 38000, t))
                             : Math.round(lerp(45000, 28000, t));
  const popupVisibleMs = Math.round(lerp(1600, 500, t));
  const popupIntervalMs = Math.round(lerp(900, 320, t));

  // More holes active at once as levels climb
  const simultaneousMax = l < 11 ? 2 : l < 26 ? 3 : l < 41 ? 4 : 5;

  const bombChance = l < FLAGS.bombsFromLevel ? 0
    : lerp(0.07, 0.20, (l - FLAGS.bombsFromLevel) / (FLAGS.totalLevels - FLAGS.bombsFromLevel));
  const goldenChance = l < FLAGS.goldenRaccoonFromLevel ? 0
    : lerp(0.05, 0.12, (l - FLAGS.goldenRaccoonFromLevel) / (FLAGS.totalLevels - FLAGS.goldenRaccoonFromLevel));
  const frozenChance = l < FLAGS.frozenFromLevel ? 0
    : lerp(0.08, 0.22, (l - FLAGS.frozenFromLevel) / (FLAGS.totalLevels - FLAGS.frozenFromLevel));

  return { level: l, quota, timeLimitMs, popupVisibleMs, popupIntervalMs,
           simultaneousMax, bombChance, goldenChance, frozenChance, isBoss };
}
