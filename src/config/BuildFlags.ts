declare const __BUILD_TARGET__: string;

export type BuildTarget = 'playables' | 'store';

export const BUILD_TARGET: BuildTarget =
  (typeof __BUILD_TARGET__ !== 'undefined' ? __BUILD_TARGET__ : 'playables') as BuildTarget;

export const IS_PLAYABLES = BUILD_TARGET === 'playables';
export const IS_STORE = BUILD_TARGET === 'store';

export const FLAGS = {
  showAds: IS_STORE,
  bottomBanner: IS_STORE,
  interstitialEveryNLevels: 5,
  bombsFromLevel: 21,
  goldenRaccoonFromLevel: 8,
  extraLifeEveryNLevels: 10,
  maxLives: 9,
  startingLives: 5,
  totalLevels: 50,
} as const;
