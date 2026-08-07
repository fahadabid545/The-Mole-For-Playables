import { FLAGS, IS_PLAYABLES, IS_PLAYGAMA, IS_CRAZYGAMES, IS_POKI } from '../config/BuildFlags';

export type AdOutcome = 'reward' | 'skipped' | 'error';

export interface AdsService {
  showBanner(): void;
  hideBanner(): void;
  showInterstitial(): Promise<void>;
  showRewarded(): Promise<AdOutcome>;
  shouldShowInterstitialForLevel(level: number): boolean;
}

// ---------- YouTube Playables — no ads path -------------------------
class PlayablesAdsService implements AdsService {
  showBanner(): void {}
  hideBanner(): void {}
  async showInterstitial(): Promise<void> {}
  async showRewarded(): Promise<AdOutcome> { return 'reward'; }
  shouldShowInterstitialForLevel(_: number): boolean { return false; }
}

// ---------- CrazyGames SDK v3 --------------------------------------
class CrazyGamesAdsService implements AdsService {
  private get sdk(): any { return (window as any)?.CrazyGames?.SDK; }

  showBanner(): void { /* CrazyGames wraps ads outside the frame; no in-game banner API */ }
  hideBanner(): void {}

  async showInterstitial(): Promise<void> {
    const ad = this.sdk?.ad;
    if (!ad?.requestAd) return;
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      try {
        ad.requestAd('midgame', {
          adStarted:  () => {},
          adFinished: done,
          adError:    done,
        });
      } catch { done(); }
      setTimeout(done, 8000); // safety timeout
    });
  }

  async showRewarded(): Promise<AdOutcome> {
    const ad = this.sdk?.ad;
    if (!ad?.requestAd) return 'skipped';
    return new Promise<AdOutcome>((resolve) => {
      let outcome: AdOutcome = 'skipped';
      try {
        ad.requestAd('rewarded', {
          adStarted:  () => {},
          adFinished: () => { outcome = 'reward'; resolve('reward'); },
          adError:    () => resolve('error'),
        });
      } catch { resolve('error'); }
      setTimeout(() => resolve(outcome), 30000);
    });
  }

  shouldShowInterstitialForLevel(level: number): boolean {
    return level > 0 && level % FLAGS.interstitialEveryNLevels === 0;
  }
}

// ---------- Poki SDK v2 --------------------------------------------
class PokiAdsService implements AdsService {
  private get sdk(): any { return (window as any)?.PokiSDK; }

  showBanner(): void {}
  hideBanner(): void {}

  async showInterstitial(): Promise<void> {
    const s = this.sdk;
    if (!s?.commercialBreak) return;
    try { await s.commercialBreak(); } catch { /* ignore */ }
  }

  async showRewarded(): Promise<AdOutcome> {
    const s = this.sdk;
    if (!s?.rewardedBreak) return 'skipped';
    try {
      const success = await s.rewardedBreak();
      return success ? 'reward' : 'skipped';
    } catch { return 'error'; }
  }

  shouldShowInterstitialForLevel(level: number): boolean {
    return level > 0 && level % FLAGS.interstitialEveryNLevels === 0;
  }
}

// ---------- Playgama Bridge ----------------------------------------
class PlaygamaAdsService implements AdsService {
  private get bridge(): any { return (window as any)?.bridge; }

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

// ---------- Store (AdMob placeholder) ------------------------------
class AdMobAdsService implements AdsService {
  showBanner(): void {}
  hideBanner(): void {}
  async showInterstitial(): Promise<void> { return; }
  async showRewarded(): Promise<AdOutcome> { return 'reward'; }
  shouldShowInterstitialForLevel(level: number): boolean {
    return FLAGS.showAds && level > 0 && level % FLAGS.interstitialEveryNLevels === 0;
  }
}

export const Ads: AdsService =
  IS_CRAZYGAMES ? new CrazyGamesAdsService() :
  IS_POKI       ? new PokiAdsService() :
  IS_PLAYGAMA   ? new PlaygamaAdsService() :
  IS_PLAYABLES  ? new PlayablesAdsService() :
                  new AdMobAdsService();
