import { TX } from '../objects/TextureFactory';

export interface SkinDef {
  id: string;
  name: string;
  cost: number;
  raccoonBody: number;
  raccoonFur: number;
  hammerHead: number;
  hammerHeadDark: number;
  hammerHandle: number;
  previewIcon: string;
}

export const SKINS: SkinDef[] = [
  {
    id: 'default',
    name: 'Classic',
    cost: 0,
    raccoonBody: 0x5d4037,
    raccoonFur: 0xd7ccc8,
    hammerHead: 0x90a4ae,
    hammerHeadDark: 0x546e7a,
    hammerHandle: 0x8d6e63,
    previewIcon: TX.raccoon,
  },
  {
    id: 'arctic',
    name: 'Arctic',
    cost: 100,
    raccoonBody: 0xcfd8dc,
    raccoonFur: 0xffffff,
    hammerHead: 0x81d4fa,
    hammerHeadDark: 0x4fc3f7,
    hammerHandle: 0xb0bec5,
    previewIcon: TX.raccoon,
  },
  {
    id: 'lava',
    name: 'Lava',
    cost: 150,
    raccoonBody: 0xbf360c,
    raccoonFur: 0xff8f00,
    hammerHead: 0xf44336,
    hammerHeadDark: 0xc62828,
    hammerHandle: 0x4e342e,
    previewIcon: TX.raccoon,
  },
  {
    id: 'jungle',
    name: 'Jungle',
    cost: 200,
    raccoonBody: 0x2e7d32,
    raccoonFur: 0xa5d6a7,
    hammerHead: 0x66bb6a,
    hammerHeadDark: 0x388e3c,
    hammerHandle: 0x5d4037,
    previewIcon: TX.raccoon,
  },
  {
    id: 'royal',
    name: 'Royal',
    cost: 300,
    raccoonBody: 0x4a148c,
    raccoonFur: 0xce93d8,
    hammerHead: 0xffd54f,
    hammerHeadDark: 0xffb300,
    hammerHandle: 0x6a1b9a,
    previewIcon: TX.raccoon,
  },
  {
    id: 'shadow',
    name: 'Shadow',
    cost: 400,
    raccoonBody: 0x212121,
    raccoonFur: 0x616161,
    hammerHead: 0x37474f,
    hammerHeadDark: 0x263238,
    hammerHandle: 0x424242,
    previewIcon: TX.raccoon,
  },
  {
    id: 'golden',
    name: 'Golden',
    cost: 500,
    raccoonBody: 0xf9a825,
    raccoonFur: 0xfff59d,
    hammerHead: 0xfdd835,
    hammerHeadDark: 0xf9a825,
    hammerHandle: 0xc68400,
    previewIcon: TX.raccoon,
  },
];

export function getSkinDef(id: string): SkinDef {
  return SKINS.find(s => s.id === id) ?? SKINS[0];
}
