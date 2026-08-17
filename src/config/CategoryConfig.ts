export type Category = 'easy' | 'hard' | 'superHard';

export const CATEGORIES: readonly Category[] = ['easy', 'hard', 'superHard'] as const;

export interface CategoryDef {
  id: Category;
  name: string;
  cols: number;
  rows: number;
  levels: number;
  unlockStars: number;
  bombsFromLevel: number;
  frozenFromLevel: number;
  goldenFromLevel: number;
  bossEveryN: number;
  extraLifeEveryN: number;
  interstitialEveryN: number;
  speedMul: number;
  timeMul: number;
  hasCat: boolean;
  hasGoat: boolean;
  catChanceBase: number;
  goatChanceBase: number;
  accentColor: number;
  accentName: string;
}

export const CATEGORY_DEFS: Record<Category, CategoryDef> = {
  easy: {
    id: 'easy',
    name: 'Easy',
    cols: 3,
    rows: 3,
    levels: 50,
    unlockStars: 0,
    bombsFromLevel: 10,
    frozenFromLevel: 30,
    goldenFromLevel: 5,
    bossEveryN: 10,
    extraLifeEveryN: 10,
    interstitialEveryN: 7,
    speedMul: 1.0,
    timeMul: 1.0,
    hasCat: false,
    hasGoat: false,
    catChanceBase: 0,
    goatChanceBase: 0,
    accentColor: 0x66bb6a,
    accentName: 'green',
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    cols: 4,
    rows: 3,
    levels: 50,
    unlockStars: 40,
    bombsFromLevel: 5,
    frozenFromLevel: 15,
    goldenFromLevel: 3,
    bossEveryN: 8,
    extraLifeEveryN: 10,
    interstitialEveryN: 7,
    speedMul: 1.25,
    timeMul: 0.9,
    hasCat: false,
    hasGoat: false,
    catChanceBase: 0,
    goatChanceBase: 0,
    accentColor: 0xffb300,
    accentName: 'amber',
  },
  superHard: {
    id: 'superHard',
    name: 'Super Hard',
    cols: 4,
    rows: 3,
    levels: 50,
    unlockStars: 90,
    bombsFromLevel: 3,
    frozenFromLevel: 8,
    goldenFromLevel: 2,
    bossEveryN: 7,
    extraLifeEveryN: 8,
    interstitialEveryN: 7,
    speedMul: 1.5,
    timeMul: 0.8,
    hasCat: true,
    hasGoat: true,
    catChanceBase: 0.12,
    goatChanceBase: 0.10,
    accentColor: 0xef5350,
    accentName: 'red',
  },
} as const;

export function getCategoryDef(cat: Category): CategoryDef {
  return CATEGORY_DEFS[cat];
}

export function isCategoryUnlocked(cat: Category, totalStars: number): boolean {
  return totalStars >= CATEGORY_DEFS[cat].unlockStars;
}
