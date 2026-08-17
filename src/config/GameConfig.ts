export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const COLORS = {
  // Sky: fresh painterly morning jungle
  skyTop: 0x7ecff0,      // clear morning blue
  skyMid: 0xbfe6d9,      // pale mint horizon
  skyBottom: 0xfff5c9,   // warm sun horizon
  mountainFar: 0x6a92a8, // hazy blue-grey ridge
  mountainNear: 0x4a7a6b,// closer misty green
  water: 0x29b6f6,
  waterDark: 0x0277bd,
  waterFoam: 0xe1f5fe,
  // Foliage
  leafDark: 0x0f4a1e,    // deep jungle
  leafMid: 0x2e8b3d,     // vivid leaf
  leafLight: 0x8bc966,   // sun-hit highlight
  leafYellow: 0xd4e157,  // extra highlight
  // Wood (warm, richer)
  wood: 0x8b5a2b,
  woodDark: 0x5d3a1a,
  woodLight: 0xc9954d,
  woodGrain: 0x6b4520,
  rope: 0xd6b47a,
  ropeShadow: 0x9a7a4a,
  // Mole (raccoon-mole, warmer brown)
  raccoonBody: 0x7a4a2e,   // rich mole brown
  raccoonMask: 0x2b1810,   // dark mask
  raccoonFur: 0xb88860,    // warm belly cream
  raccoonNose: 0xff7043,
  hammerHead: 0xd7d7d7,
  hammerHeadDark: 0x555555,
  hammerHandle: 0x8b5a2b,
  heart: 0xe53935,
  heartEmpty: 0x424242,
  gold: 0xffd54f,
  bomb: 0x263238,
  panelBg: 0xfff5c9,
  panelBorder: 0x5d3a1a,
  textDark: 0x2b1810,
  textLight: 0xfff5c9,
  starYellow: 0xffd54f,
  dust: 0xe6d3b3,
} as const;

export const GRID = {
  cols: 3,
  rows: 3,
  paddingX: 90,
  paddingTop: 380,
  paddingBottom: 220,
  holeRadius: 90,
};

export interface GridLayout {
  cols: number;
  rows: number;
  paddingX: number;
  paddingTop: number;
  paddingBottom: number;
  holeRadius: number;
}

export function getGridForCategory(cols: number, rows: number): GridLayout {
  if (cols === 3 && rows === 3) return GRID;
  return {
    cols,
    rows,
    paddingX: 60,
    paddingTop: 360,
    paddingBottom: 200,
    holeRadius: 75,
  };
}
