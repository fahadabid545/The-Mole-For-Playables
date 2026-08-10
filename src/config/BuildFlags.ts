declare const __BUILD_TARGET__: string;

export type BuildTarget = 'playables' | 'playgama' | 'crazygames' | 'poki';

export const BUILD_TARGET: BuildTarget =
  (typeof __BUILD_TARGET__ !== 'undefined' ? __BUILD_TARGET__ : 'playables') as BuildTarget;

export const IS_PLAYABLES = BUILD_TARGET === 'playables';
export const IS_PLAYGAMA = BUILD_TARGET === 'playgama';
export const IS_CRAZYGAMES = BUILD_TARGET === 'crazygames';
export const IS_POKI = BUILD_TARGET === 'poki';
// True whenever the build target ships behind a portal SDK.
export const IS_PORTAL = IS_PLAYGAMA || IS_CRAZYGAMES || IS_POKI;

export const FLAGS = {
  showAds: IS_PORTAL,
  bottomBanner: IS_PORTAL,
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
