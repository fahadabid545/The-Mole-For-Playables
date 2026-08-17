import { FLAGS } from './BuildFlags';
import { type Category, type CategoryDef, CATEGORY_DEFS } from './CategoryConfig';

export interface LevelParams {
  level: number;
  quota: number;
  scoreTarget: number;
  timeLimitMs: number;
  popupVisibleMs: number;
  popupIntervalMs: number;
  simultaneousMax: number;
  bombChance: number;
  goldenChance: number;
  frozenChance: number;
  catChance: number;
  goatChance: number;
  isBoss: boolean;
  category: Category;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

export function getLevelParams(level: number, category: Category = 'easy'): LevelParams {
  const def = CATEGORY_DEFS[category];
  const totalLevels = def.levels;
  const l = Math.max(1, Math.min(totalLevels, level));
  const t = (l - 1) / (totalLevels - 1);
  const isBoss = l % def.bossEveryN === 0;

  const quota = isBoss ? Math.max(3, Math.round(4 + l / 12))
                       : Math.round(lerp(5, 55, t));
  const scoreTarget = isBoss ? Math.round(lerp(150, 800, t))
                             : Math.round(lerp(50, 600, t));
  const baseTime = isBoss ? lerp(45000, 38000, t) : lerp(45000, 28000, t);
  const timeLimitMs = Math.round(baseTime * def.timeMul);
  const popupVisibleMs = Math.round(lerp(1600, 500, t) / def.speedMul);
  const popupIntervalMs = Math.round(lerp(900, 320, t) / def.speedMul);

  const maxHoles = def.cols * def.rows;
  const simultaneousMax = Math.min(maxHoles - 1,
    l < 11 ? 2 : l < 26 ? 3 : l < 41 ? 4 : 5);

  const bombChance = l < def.bombsFromLevel ? 0
    : lerp(0.07, 0.20, (l - def.bombsFromLevel) / (totalLevels - def.bombsFromLevel));
  const goldenChance = l < def.goldenFromLevel ? 0
    : lerp(0.05, 0.12, (l - def.goldenFromLevel) / (totalLevels - def.goldenFromLevel));
  const frozenChance = l < def.frozenFromLevel ? 0
    : lerp(0.08, 0.22, (l - def.frozenFromLevel) / (totalLevels - def.frozenFromLevel));

  const catChance = def.hasCat ? lerp(def.catChanceBase * 0.3, def.catChanceBase, t) : 0;
  const goatChance = def.hasGoat ? lerp(def.goatChanceBase * 0.3, def.goatChanceBase, t) : 0;

  return {
    level: l, quota, scoreTarget, timeLimitMs, popupVisibleMs, popupIntervalMs,
    simultaneousMax, bombChance, goldenChance, frozenChance, catChance, goatChance,
    isBoss, category,
  };
}
