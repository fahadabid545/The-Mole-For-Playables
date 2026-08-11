import { FLAGS } from './BuildFlags';
import type { CategoryId } from './Theme';

export interface LevelParams {
  level: number;
  category: CategoryId;
  quota: number;
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
  grid: GridSpec;
}

export interface GridSpec {
  cols: number;
  rows: number;
  paddingX: number;
  paddingTop: number;
  paddingBottom: number;
  holeRadius: number;
}

const GRID_EASY: GridSpec       = { cols: 3, rows: 3, paddingX: 90, paddingTop: 380, paddingBottom: 220, holeRadius: 90 };
const GRID_HARD: GridSpec       = { cols: 4, rows: 3, paddingX: 60, paddingTop: 380, paddingBottom: 220, holeRadius: 72 };
const GRID_SUPER_HARD: GridSpec = { cols: 4, rows: 3, paddingX: 60, paddingTop: 380, paddingBottom: 220, holeRadius: 72 };

export function getGridForCategory(cat: CategoryId): GridSpec {
  if (cat === 'hard') return GRID_HARD;
  if (cat === 'superHard') return GRID_SUPER_HARD;
  return GRID_EASY;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

export function getLevelParams(level: number, category: CategoryId = 'easy'): LevelParams {
  const l = Math.max(1, Math.min(FLAGS.totalLevels, level));
  const t = (l - 1) / (FLAGS.totalLevels - 1);
  const isBoss = l % FLAGS.bossEveryNLevels === 0;
  const grid = getGridForCategory(category);

  const quotaBase = isBoss ? Math.max(3, Math.round(4 + l / 12))
                           : Math.round(lerp(5, 55, t));
  const timeBase = isBoss ? Math.round(lerp(45000, 38000, t))
                          : Math.round(lerp(45000, 28000, t));
  const visibleBase = Math.round(lerp(1600, 500, t));
  const intervalBase = Math.round(lerp(900, 320, t));
  const simBase = l < 11 ? 2 : l < 26 ? 3 : l < 41 ? 4 : 5;

  const bombChance = l < FLAGS.bombsFromLevel ? 0
    : lerp(0.07, 0.20, (l - FLAGS.bombsFromLevel) / (FLAGS.totalLevels - FLAGS.bombsFromLevel));
  const goldenChance = l < FLAGS.goldenRaccoonFromLevel ? 0
    : lerp(0.05, 0.12, (l - FLAGS.goldenRaccoonFromLevel) / (FLAGS.totalLevels - FLAGS.goldenRaccoonFromLevel));
  const frozenChance = l < FLAGS.frozenFromLevel ? 0
    : lerp(0.08, 0.22, (l - FLAGS.frozenFromLevel) / (FLAGS.totalLevels - FLAGS.frozenFromLevel));

  let quota = quotaBase;
  let timeLimitMs = timeBase;
  let popupVisibleMs = visibleBase;
  let popupIntervalMs = intervalBase;
  let simultaneousMax = simBase;
  let catChance = 0;
  let goatChance = 0;

  if (category === 'hard') {
    popupVisibleMs = Math.round(visibleBase * 0.8);
    popupIntervalMs = Math.round(intervalBase * 0.75);
    simultaneousMax = Math.min(grid.cols * grid.rows, simBase + 1);
    timeLimitMs = Math.round(timeBase * 0.9);
  } else if (category === 'superHard') {
    popupVisibleMs = Math.round(visibleBase * 0.7);
    popupIntervalMs = Math.round(intervalBase * 0.65);
    simultaneousMax = Math.min(grid.cols * grid.rows, simBase + 2);
    timeLimitMs = Math.round(timeBase * 0.85);
    catChance = 0.10;
    goatChance = 0.08;
  }

  return {
    level: l, category, quota, timeLimitMs, popupVisibleMs, popupIntervalMs,
    simultaneousMax, bombChance, goldenChance, frozenChance,
    catChance, goatChance, isBoss, grid,
  };
}
