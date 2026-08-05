export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const COLORS = {
  skyTop: 0xffb74d,      // warm morning orange
  skyMid: 0xffe0b2,      // soft peach
  skyBottom: 0xfff8e1,   // creamy horizon
  water: 0x29b6f6,
  waterDark: 0x0288d1,
  waterFoam: 0xe1f5fe,
  leafDark: 0x1b5e20,
  leafMid: 0x2e7d32,
  leafLight: 0x81c784,   // brighter foliage highlight
  wood: 0x6d4c41,
  woodDark: 0x4e342e,
  woodLight: 0x8d6e63,
  raccoonBody: 0x616161,
  raccoonMask: 0x212121,
  raccoonFur: 0x9e9e9e,
  raccoonNose: 0xef5350,
  hammerHead: 0xbdbdbd,
  hammerHeadDark: 0x616161,
  hammerHandle: 0x8d6e63,
  heart: 0xe53935,
  heartEmpty: 0x424242,
  gold: 0xffd54f,
  bomb: 0x263238,
  panelBg: 0xfff8e1,
  panelBorder: 0x6d4c41,
  textDark: 0x3e2723,
  textLight: 0xfffde7,
  starYellow: 0xfff176,
  dust: 0xd7ccc8,
} as const;

export const GRID = {
  cols: 3,
  rows: 3,
  paddingX: 90,
  paddingTop: 380,
  paddingBottom: 220,
  holeRadius: 90,
};
