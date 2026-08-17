import { FLAGS, IS_PLAYABLES, IS_PLAYGAMA, IS_CRAZYGAMES, IS_POKI } from '../config/BuildFlags';
import { Audio } from './AudioService';
import { EventBus, EVT } from '../utils/EventBus';

export type AdOutcome = 'reward' | 'skipped' | 'error';

// Wrap an ad-showing async call: mute audio + emit AD_START before,
// restore audio + emit AD_END after. GameScene listens for AD_START /
// AD_END to pause / resume gameplay so the game freezes during an ad.
async function withAdLifecycle<T>(run: () => Promise<T>): Promise<T> {
  try {
    Audio.setMutedByPortal(true);
    EventBus.emit(EVT.AD_START);
    return await run();
  } finally {
    Audio.setMutedByPortal(false);
    EventBus.emit(EVT.AD_END);
  }
}

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
    return withAdLifecycle(() => new Promise<void>((resolve) => {
      const done = () => resolve();
      try {
        ad.requestAd('midgame', {
          adStarted:  () => {},
          adFinished: done,
          adError:    done,
        });
      } catch { done(); }
      setTimeout(done, 8000);
    }));
  }

  async showRewarded(): Promise<AdOutcome> {
    const ad = this.sdk?.ad;
    if (!ad?.requestAd) return 'skipped';
    return withAdLifecycle(() => new Promise<AdOutcome>((resolve) => {
      let outcome: AdOutcome = 'skipped';
      try {
        ad.requestAd('rewarded', {
          adStarted:  () => {},
          adFinished: () => { outcome = 'reward'; resolve('reward'); },
          adError:    () => resolve('error'),
        });
      } catch { resolve('error'); }
      setTimeout(() => resolve(outcome), 30000);
    }));
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
    return withAdLifecycle(async () => {
      try { await s.commercialBreak(); } catch { /* ignore */ }
    });
  }

  async showRewarded(): Promise<AdOutcome> {
    const s = this.sdk;
    if (!s?.rewardedBreak) return 'skipped';
    return withAdLifecycle(async () => {
      try {
        const success = await s.rewardedBreak();
        return success ? 'reward' : 'skipped';
      } catch { return 'error' as AdOutcome; }
    });
  }

  shouldShowInterstitialForLevel(level: number): boolean {
    return level > 0 && level % FLAGS.interstitialEveryNLevels === 0;
  }
}

// ---------- Playgama Bridge v2 -------------------------------------
// v2 API: showInterstitial() / showRewarded() return void. State
// transitions arrive via advertisement.on(EVENT_NAME.*_STATE_CHANGED,
// cb). Terminal states resolve the promise.
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
    const ad = b?.advertisement;
    if (!ad?.showInterstitial) return;
    const EVT_STATE = b.EVENT_NAME?.INTERSTITIAL_STATE_CHANGED ?? 'interstitial_state_changed';
    const CLOSED = b.INTERSTITIAL_STATE?.CLOSED ?? 'closed';
    const FAILED = b.INTERSTITIAL_STATE?.FAILED ?? 'failed';
    return withAdLifecycle(() => new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try { ad.off?.(EVT_STATE, onState); } catch { /* ignore */ }
        resolve();
      };
      const onState = (state: string) => {
        if (state === CLOSED || state === FAILED) finish();
      };
      try { ad.on?.(EVT_STATE, onState); } catch { /* ignore */ }
      try { ad.showInterstitial(); } catch { finish(); }
      setTimeout(finish, 30000);
    }));
  }
  async showRewarded(): Promise<AdOutcome> {
    const b = this.bridge;
    const ad = b?.advertisement;
    if (!ad?.showRewarded) return 'skipped';
    const EVT_STATE = b.EVENT_NAME?.REWARDED_STATE_CHANGED ?? 'rewarded_state_changed';
    const REWARDED = b.REWARDED_STATE?.REWARDED ?? 'rewarded';
    const CLOSED = b.REWARDED_STATE?.CLOSED ?? 'closed';
    const FAILED = b.REWARDED_STATE?.FAILED ?? 'failed';
    return withAdLifecycle(() => new Promise<AdOutcome>((resolve) => {
      let rewarded = false;
      let done = false;
      const finish = (outcome: AdOutcome) => {
        if (done) return;
        done = true;
        try { ad.off?.(EVT_STATE, onState); } catch { /* ignore */ }
        resolve(outcome);
      };
      const onState = (state: string) => {
        if (state === REWARDED) rewarded = true;
        else if (state === CLOSED) finish(rewarded ? 'reward' : 'skipped');
        else if (state === FAILED) finish('error');
      };
      try { ad.on?.(EVT_STATE, onState); } catch { /* ignore */ }
      try { ad.showRewarded(); } catch { finish('error'); }
      setTimeout(() => finish(rewarded ? 'reward' : 'skipped'), 60000);
    }));
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
