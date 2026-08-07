import { FLAGS, IS_PLAYABLES, IS_PLAYGAMA } from '../config/BuildFlags';

export type AdOutcome = 'reward' | 'skipped' | 'error';

export interface AdsService {
  showBanner(): void;
  hideBanner(): void;
  showInterstitial(): Promise<void>;
  showRewarded(): Promise<AdOutcome>;
  shouldShowInterstitialForLevel(level: number): boolean;
}

class PlayablesAdsService implements AdsService {
  showBanner(): void {}
  hideBanner(): void {}
  async showInterstitial(): Promise<void> {}
  async showRewarded(): Promise<AdOutcome> { return 'reward'; }
  shouldShowInterstitialForLevel(_: number): boolean { return false; }
}

// Playgama Bridge — auto-injected into window.bridge on their portals.
// Wraps calls in optional chaining so a missing bridge (e.g. before it
// finishes loading, or during a preview build) never crashes the game.
class PlaygamaAdsService implements AdsService {
  private get bridge(): any { return (window as any).bridge; }

  showBanner(): void {
    try { this.bridge?.advertisement?.showBanner?.(); } catch { /* ignore */ }
  }
  hideBanner(): void {
    try { this.bridge?.advertisement?.hideBanner?.(); } catch { /* ignore */ }
  }
  async showInterstitial(): Promise<void> {
    const b = this.bridge;
    if (!b?.advertisement?.showInterstitial) return;
    await new Promise<void>((resolve) => {
      try {
        b.advertisement.showInterstitial({
          callbacks: { onClose: () => resolve(), onError: () => resolve() },
        });
      } catch { resolve(); }
      // Safety timeout — if callbacks never fire, don't block the game
      setTimeout(resolve, 8000);
    });
  }
  async showRewarded(): Promise<AdOutcome> {
    const b = this.bridge;
    if (!b?.advertisement?.showRewarded) return 'skipped';
    return new Promise<AdOutcome>((resolve) => {
      let rewarded = false;
      try {
        b.advertisement.showRewarded({
          callbacks: {
            onRewarded: () => { rewarded = true; },
            onClose:    () => resolve(rewarded ? 'reward' : 'skipped'),
            onError:    () => resolve('error'),
          },
        });
      } catch { resolve('error'); }
      setTimeout(() => resolve(rewarded ? 'reward' : 'skipped'), 30000);
    });
  }
  shouldShowInterstitialForLevel(level: number): boolean {
    return level > 0 && level % FLAGS.interstitialEveryNLevels === 0;
  }
}

class AdMobAdsService implements AdsService {
  showBanner(): void {
    // TODO(store): call @capacitor-community/admob showBanner.
  }
  hideBanner(): void {
    // TODO(store): AdMob.hideBanner.
  }
  async showInterstitial(): Promise<void> {
    // TODO(store): AdMob.prepareInterstitial + showInterstitial.
    return;
  }
  async showRewarded(): Promise<AdOutcome> {
    // TODO(store): AdMob.prepareRewardVideoAd + showRewardVideoAd; return 'reward' only after AD_REWARD event.
    return 'reward';
  }
  shouldShowInterstitialForLevel(level: number): boolean {
    return FLAGS.showAds && level > 0 && level % FLAGS.interstitialEveryNLevels === 0;
  }
}

export const Ads: AdsService =
  IS_PLAYGAMA  ? new PlaygamaAdsService()  :
  IS_PLAYABLES ? new PlayablesAdsService() :
                 new AdMobAdsService();
