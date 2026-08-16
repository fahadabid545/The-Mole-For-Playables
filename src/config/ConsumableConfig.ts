export type ConsumableKind =
  | 'freeze'
  | 'double'
  | 'magnet'
  | 'shield'
  | 'slowmo'
  | 'xray'
  | 'multiTap'
  | 'timeWarp'
  | 'goldenTouch'
  | 'bombDefuse'
  | 'frenzy'
  | 'lucky';

export interface ConsumableDef {
  kind: ConsumableKind;
  name: string;
  desc: string;
  cost: number;
  durationMs: number;
  icon: string;
}

export const CONSUMABLES: Record<ConsumableKind, ConsumableDef> = {
  freeze: {
    kind: 'freeze',
    name: 'Time Freeze',
    desc: 'Stops the timer for 5 seconds',
    cost: 15,
    durationMs: 5000,
    icon: 'iconFreeze',
  },
  double: {
    kind: 'double',
    name: 'Double Points',
    desc: 'Double score for 8 seconds',
    cost: 20,
    durationMs: 8000,
    icon: 'iconDouble',
  },
  magnet: {
    kind: 'magnet',
    name: 'Magnet',
    desc: 'Auto-hits the next 3 raccoons',
    cost: 25,
    durationMs: 0,
    icon: 'iconMagnet',
  },
  shield: {
    kind: 'shield',
    name: 'Bomb Shield',
    desc: 'Blocks the next bomb penalty',
    cost: 15,
    durationMs: 0,
    icon: 'iconShield',
  },
  slowmo: {
    kind: 'slowmo',
    name: 'Slow Motion',
    desc: 'Raccoons stay up 50% longer for 10s',
    cost: 20,
    durationMs: 10000,
    icon: 'iconSlowmo',
  },
  xray: {
    kind: 'xray',
    name: 'X-Ray',
    desc: 'Shows which holes will pop next for 8s',
    cost: 30,
    durationMs: 8000,
    icon: 'iconXray',
  },
  multiTap: {
    kind: 'multiTap',
    name: 'Multi-Tap',
    desc: 'Each tap hits all visible raccoons for 5s',
    cost: 40,
    durationMs: 5000,
    icon: 'iconMultiTap',
  },
  timeWarp: {
    kind: 'timeWarp',
    name: 'Time Warp',
    desc: 'Adds 10 seconds to the clock',
    cost: 25,
    durationMs: 0,
    icon: 'iconTimeWarp',
  },
  goldenTouch: {
    kind: 'goldenTouch',
    name: 'Golden Touch',
    desc: 'All raccoons give golden-value points for 6s',
    cost: 35,
    durationMs: 6000,
    icon: 'iconGoldenTouch',
  },
  bombDefuse: {
    kind: 'bombDefuse',
    name: 'Bomb Defuse',
    desc: 'All bombs become normal raccoons for 10s',
    cost: 20,
    durationMs: 10000,
    icon: 'iconBombDefuse',
  },
  frenzy: {
    kind: 'frenzy',
    name: 'Frenzy',
    desc: 'Raccoons pop twice as fast for 6s',
    cost: 30,
    durationMs: 6000,
    icon: 'iconFrenzy',
  },
  lucky: {
    kind: 'lucky',
    name: 'Lucky Clover',
    desc: 'Golden raccoon chance tripled for 10s',
    cost: 25,
    durationMs: 10000,
    icon: 'iconLucky',
  },
};

export const CONSUMABLE_KINDS = Object.keys(CONSUMABLES) as ConsumableKind[];

export const MAGIC_BOX_COOLDOWN_MS = 24 * 60 * 60 * 1000;
