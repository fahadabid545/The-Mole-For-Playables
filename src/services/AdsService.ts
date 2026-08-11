import { FLAGS, IS_PLAYABLES, IS_PLAYGAMA, IS_CRAZYGAMES, IS_POKI } from '../config/BuildFlags';
import { Audio } from './AudioService';
import { EventBus, EVT } from '../utils/EventBus';

export type AdOutcome = 'reward' | 'skipped' | 'error';

// Mute audio + broadcast AD_START/END around the platform ad call so
// GameScene can pause the timer and taps while an ad is on screen.
async function withAdLifecycle<T>(run: () => Promise<T>): Promise<T> {
  const prevMuted = Audio.isMuted();
  try {
    if (!prevMuted) Audio.setMuted(true);
    EventBus.emit(EVT.AD_START);
    return await run();
  } finally {
    if (!prevMuted) Audio.setMuted(false);
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

// YouTube Playables ships without ads.
class PlayablesAdsService implements AdsService {
  showBanner(): void {}
  hideBanner(): void {}
  async showInterstitial(): Promise<void> {}
  async showRewarded(): Promise<AdOutcome> { return 'reward'; }
  shouldShowInterstitialForLevel(_: number): boolean { return false; }
}

class CrazyGamesAdsService implements AdsService {
  private get sdk(): any { return (window as any)?.CrazyGames?.SDK; }

  // CrazyGames wraps banners outside the game frame; nothing to wire here.
  showBanner(): void {}
  hideBanner(): void {}

  async showInterstitial(): Promise<void> {
    const ad = this.sdk?.ad;
    if (!ad?.requestAd) return;
    return withAdLifecycle(() => new Promise<void>((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(); };
      try {
        ad.requestAd('midgame', {
          adStarted:  () => {},
          adFinished: finish,
          adError:    finish,
        });
      } catch { finish(); }
      // Safety cap: if the SDK never fires adFinished/adError, resolve
      // anyway so the game can continue.
      setTimeout(finish, 15000);
    }));
  }

  async showRewarded(): Promise<AdOutcome> {
    const ad = this.sdk?.ad;
    if (!ad?.requestAd) return 'skipped';
    return withAdLifecycle(() => new Promise<AdOutcome>((resolve) => {
      let done = false;
      let outcome: AdOutcome = 'skipped';
      const finish = (o: AdOutcome) => { if (done) return; done = true; resolve(o); };
      try {
        ad.requestAd('rewarded', {
          adStarted:  () => {},
          adFinished: () => { outcome = 'reward'; finish('reward'); },
          adError:    () => finish('error'),
        });
      } catch { finish('error'); }
      // Safety cap: 18s is longer than a real rewarded video's load +
      // playback, but short enough that a broken SDK doesn't strand
      // the player.
      setTimeout(() => finish(outcome), 18000);
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

export const Ads: AdsService =
  IS_CRAZYGAMES ? new CrazyGamesAdsService() :
  IS_POKI       ? new PokiAdsService() :
  IS_PLAYGAMA   ? new PlaygamaAdsService() :
                  new PlayablesAdsService();
