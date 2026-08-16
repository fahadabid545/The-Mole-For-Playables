declare const __BUILD_TARGET__: string;

export type BuildTarget = 'playables' | 'store' | 'playgama' | 'crazygames' | 'poki';

export const BUILD_TARGET: BuildTarget =
  (typeof __BUILD_TARGET__ !== 'undefined' ? __BUILD_TARGET__ : 'playables') as BuildTarget;

export const IS_PLAYABLES = BUILD_TARGET === 'playables';
export const IS_STORE = BUILD_TARGET === 'store';
export const IS_PLAYGAMA = BUILD_TARGET === 'playgama';
export const IS_CRAZYGAMES = BUILD_TARGET === 'crazygames';
export const IS_POKI = BUILD_TARGET === 'poki';
// True whenever the build is running inside a web-game portal (has some
// kind of SDK bridge injected). Used to enable ad-supported UI paths.
export const IS_PORTAL = IS_PLAYGAMA || IS_CRAZYGAMES || IS_POKI;

export const FLAGS = {
  showAds: IS_STORE || IS_PORTAL,
  bottomBanner: IS_STORE || IS_PORTAL,
  interstitialEveryNLevels: 7,
  bombsFromLevel: 10,
  frozenFromLevel: 30,
  goldenRaccoonFromLevel: 5,
  bossEveryNLevels: 10,
  extraLifeEveryNLevels: 10,
  maxLives: 9,
  startingLives: 5,
  totalLevels: 50,
} as const;
