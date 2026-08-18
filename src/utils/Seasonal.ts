export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export function getSeason(): Season {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

export const SEASONAL_LEAF_TINTS: Record<Season, number[]> = {
  spring: [0x81c784, 0xa5d6a7, 0xf48fb1, 0xffcc80],
  summer: [0x4caf50, 0x66bb6a, 0x81c784, 0x2e7d32],
  autumn: [0xff8a65, 0xffb74d, 0xffd54f, 0xd84315],
  winter: [0xb0bec5, 0x90caf9, 0xcfd8dc, 0xe0e0e0],
};

export const SEASONAL_HOLE_ACCENT: Record<Season, number> = {
  spring: 0xf48fb1,
  summer: 0x4caf50,
  autumn: 0xff6f00,
  winter: 0x90caf9,
};
