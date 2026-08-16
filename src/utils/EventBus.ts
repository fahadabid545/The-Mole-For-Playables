import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const EVT = {
  LIFE_CHANGED: 'life-changed',
  SCORE_CHANGED: 'score-changed',
  LEVEL_STARTED: 'level-started',
  LEVEL_COMPLETED: 'level-completed',
  LEVEL_FAILED: 'level-failed',
  OUT_OF_LIVES: 'out-of-lives',
  EXTRA_LIFE_AWARDED: 'extra-life-awarded',
  TIMER_TICK: 'timer-tick',
  MUTE_TOGGLED: 'mute-toggled',
  AD_START: 'ad-start',
  AD_END:   'ad-end',
  PLATFORM_PAUSE:  'platform-pause',
  PLATFORM_RESUME: 'platform-resume',
  COINS_CHANGED: 'coins-changed',
  CONSUMABLE_USED: 'consumable-used',
  CONSUMABLE_EXPIRED: 'consumable-expired',
  COMBO_CHANGED: 'combo-changed',
} as const;
