// Shared design tokens. All scenes/components import colors and easing
// from here so a category variant or dark mode is a one-place change.

import { COLORS } from './GameConfig';

export type CategoryId = 'easy' | 'hard' | 'superHard';

export interface Palette {
  skyTop: number;
  skyMid: number;
  skyBottom: number;
  mountainFar: number;
  mountainNear: number;
  leafDark: number;
  leafMid: number;
  leafLight: number;
  wood: number;
  woodDark: number;
  woodLight: number;
  panelBg: number;
  panelBorder: number;
  textDark: number;
  textLight: number;
  accent: number;
  danger: number;
  positive: number;
}

const EASY: Palette = {
  skyTop: COLORS.skyTop,
  skyMid: COLORS.skyMid,
  skyBottom: COLORS.skyBottom,
  mountainFar: COLORS.mountainFar,
  mountainNear: COLORS.mountainNear,
  leafDark: COLORS.leafDark,
  leafMid: COLORS.leafMid,
  leafLight: COLORS.leafLight,
  wood: COLORS.wood,
  woodDark: COLORS.woodDark,
  woodLight: COLORS.woodLight,
  panelBg: COLORS.panelBg,
  panelBorder: COLORS.panelBorder,
  textDark: COLORS.textDark,
  textLight: COLORS.textLight,
  accent: 0xffb300,
  danger: 0xef5350,
  positive: 0x66bb6a,
};

const HARD: Palette = {
  ...EASY,
  skyTop: 0xff9a5e,
  skyMid: 0xffb46b,
  skyBottom: 0xffd89b,
  mountainFar: 0x4a4a70,
  mountainNear: 0x2e2e50,
  leafDark: 0x1a3a2a,
  leafMid: 0x2e6b4a,
  leafLight: 0x6ea87e,
  accent: 0xff7043,
};

const SUPER_HARD: Palette = {
  ...EASY,
  skyTop: 0x1a0f2e,
  skyMid: 0x3a1a3e,
  skyBottom: 0x6a1a2e,
  mountainFar: 0x2a1620,
  mountainNear: 0x1a0d18,
  leafDark: 0x0a1a10,
  leafMid: 0x1a3a20,
  leafLight: 0x3a6a40,
  wood: 0x6a3a20,
  woodDark: 0x3a1e10,
  woodLight: 0x8a5a30,
  panelBg: 0x2a1e2e,
  panelBorder: 0x8a3a3a,
  textDark: 0xfff5c9,
  textLight: 0xfff5c9,
  accent: 0xff5252,
  danger: 0xff1744,
};

const PALETTES: Record<CategoryId, Palette> = {
  easy: EASY,
  hard: HARD,
  superHard: SUPER_HARD,
};

let active: CategoryId = 'easy';

export const Theme = {
  set(cat: CategoryId): void { active = cat; },
  active(): CategoryId { return active; },
  palette(cat: CategoryId = active): Palette { return PALETTES[cat]; },
  hex(color: number): string {
    return '#' + color.toString(16).padStart(6, '0');
  },
};

export const EASE = {
  buttonPress: 'Quad.Out',
  popupIn: 'Back.Out',
  popupOut: 'Sine.In',
  scorePop: 'Cubic.Out',
  hitSquash: 'Sine.InOut',
} as const;

export const DUR = {
  buttonPress: 70,
  popupIn: 320,
  popupOut: 180,
  scorePop: 550,
  hitSquash: 60,
  scoreCountUp: 900,
} as const;
