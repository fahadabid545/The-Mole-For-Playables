declare const __BUILD_TARGET__: string;

export type BuildTarget = 'playables' | 'store' | 'playgama';

export const BUILD_TARGET: BuildTarget =
  (typeof __BUILD_TARGET__ !== 'undefined' ? __BUILD_TARGET__ : 'playables') as BuildTarget;

export const IS_PLAYABLES = BUILD_TARGET === 'playables';
export const IS_STORE = BUILD_TARGET === 'store';
export const IS_PLAYGAMA = BUILD_TARGET === 'playgama';

export const FLAGS = {
  showAds: IS_STORE || IS_PLAYGAMA,
  bottomBanner: IS_STORE || IS_PLAYGAMA,
  interstitialEveryNLevels: 5,
  bombsFromLevel: 10,
  frozenFromLevel: 30,
  goldenRaccoonFromLevel: 5,
  bossEveryNLevels: 10,
  extraLifeEveryNLevels: 10,
  maxLives: 9,
  startingLives: 5,
  totalLevels: 50,
} as const;
