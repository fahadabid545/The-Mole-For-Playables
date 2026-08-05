import { FLAGS, IS_PLAYABLES } from '../config/BuildFlags';

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

class AdMobAdsService implements AdsService {
  showBanner(): void {
    // TODO(store): call @capacitor-community/admob showBanner.
    // Wrapped in try/catch so it's safe even before native init.
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

export const Ads: AdsService = IS_PLAYABLES ? new PlayablesAdsService() : new AdMobAdsService();
