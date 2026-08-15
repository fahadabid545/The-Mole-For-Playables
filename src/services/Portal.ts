import { IS_CRAZYGAMES, IS_POKI, IS_PLAYGAMA, IS_PORTAL } from '../config/BuildFlags';

// Unified facade over the CrazyGames / Poki / Playgama SDKs. Every
// method is a safe no-op on non-portal builds and swallows missing-SDK
// errors so a bad CDN load or non-portal host can never crash the game.

interface CGSDK {
  init?: () => Promise<void>;
  game?: {
    loadingStart?: () => void;
    loadingStop?:  () => void;
    gameplayStart?: () => void;
    gameplayStop?:  () => void;
  };
  ad?: {
    requestAd?: (kind: 'midgame' | 'rewarded', callbacks: Record<string, (...args: unknown[]) => void>) => void;
  };
  data?: {
    setItem?: (k: string, v: string) => void | Promise<void>;
    getItem?: (k: string) => string | null | Promise<string | null>;
  };
  user?: {
    addAuthListener?: (fn: (event: unknown) => void) => void;
  };
  banner?: {
    requestBanner?: (opts: unknown) => Promise<unknown>;
  };
}
interface PokiSDK {
  init?: () => Promise<void>;
  gameLoadingStart?: () => void;
  gameLoadingFinished?: () => void;
  gameplayStart?: () => void;
  gameplayStop?: () => void;
  commercialBreak?: () => Promise<void>;
  rewardedBreak?: () => Promise<boolean>;
  setDebug?: (v: boolean) => void;
  shareableURL?: (params: unknown) => Promise<string>;
}

// Structural subset of Playgama Bridge v2 the game touches.
// Full types live in node_modules/@playgama/bridge/dist/types.
interface PGBridge {
  initialize?: (opts?: { configFilePath?: string }) => Promise<void>;
  isInitialized?: boolean;
  setGameLoadingProgress?: (percent: number) => void;
  platform?: {
    sendMessage?: (msg: string, opts?: Record<string, unknown>) => Promise<unknown>;
    on?: (evt: string, cb: (v: unknown) => void) => void;
    isPaused?: boolean;
    isAudioEnabled?: boolean;
  };
  PLATFORM_MESSAGE?: Record<string, string>;
  EVENT_NAME?: Record<string, string>;
  advertisement?: {
    isInterstitialSupported?: boolean;
    isRewardedSupported?: boolean;
    isBannerSupported?: boolean;
    showInterstitial?: (placement?: string | null) => void;
    showRewarded?: (placement?: string | null) => void;
    preloadInterstitial?: (placement?: string | null) => void;
    preloadRewarded?: (placement?: string | null) => void;
    showBanner?: (position?: string, placement?: string | null) => void;
    hideBanner?: () => void;
    checkAdBlock?: () => Promise<boolean>;
    on?: (evt: string, cb: (state: string) => void) => void;
    off?: (evt: string, cb: (state: string) => void) => void;
  };
  achievements?: {
    unlock?: (key: string) => Promise<unknown>;
    isSupported?: boolean;
  };
  player?: {
    isAuthorizationSupported?: boolean;
    isAuthorized?: boolean;
    id?: string | null;
    name?: string | null;
    photos?: string[];
    authorize?: (options?: Record<string, unknown>) => Promise<unknown>;
  };
}

const w = typeof window !== 'undefined' ? (window as unknown as {
  CrazyGames?: { SDK?: CGSDK };
  PokiSDK?: PokiSDK;
  bridge?: PGBridge;
}) : undefined;

const cg = () => w?.CrazyGames?.SDK;
const pk = () => w?.PokiSDK;
const pg = () => w?.bridge;

// Some CDN scripts hydrate after our module code runs, so poll briefly.
async function waitFor<T>(get: () => T | undefined, timeoutMs = 2000): Promise<T | undefined> {
  const step = 100;
  for (let waited = 0; waited < timeoutMs; waited += step) {
    const v = get();
    if (v) return v;
    await new Promise(r => setTimeout(r, step));
  }
  return get();
}

// Small helper: send a Playgama PLATFORM_MESSAGE by symbolic name.
// Falls back to the wire literal so a bridge missing the constants
// map still sends the correct message string.
function sendPG(msgKey: string, wireFallback: string, opts?: Record<string, unknown>): void {
  if (!IS_PLAYGAMA) return;
  try {
    const b = pg();
    const msg = b?.PLATFORM_MESSAGE?.[msgKey] ?? wireFallback;
    b?.platform?.sendMessage?.(msg, opts);
  } catch { /* ignore */ }
}

export const Portal = {
  // --- Lifecycle -----------------------------------------------------

  async init(): Promise<void> {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) {
        const sdk = await waitFor(cg);
        await sdk?.init?.();
        sdk?.game?.loadingStart?.();
      } else if (IS_POKI) {
        const sdk = await waitFor(pk);
        await sdk?.init?.();
        sdk?.gameLoadingStart?.();
      } else if (IS_PLAYGAMA) {
        const b = await waitFor(pg, 8000);
        if (!b?.initialize) return;
        // Do NOT soft-timeout initialize — bridge.platform is only wired
        // to the host after it resolves; sendMessage(GAME_READY) sent
        // early drops silently. BootScene provides the outer 10s cap.
        await b.initialize();
        // In-game asset loading has started (Preload will fire the
        // matching STOPPED message from ready()).
        sendPG('IN_GAME_LOADING_STARTED', 'in_game_loading_started');
      }
    } catch { /* ignore */ }
  },

  // Report boot / preload progress (0..1). Playgama v2 uses this to
  // drive its host-side loading UI; other portals ignore it.
  setLoadingProgress(fraction: number): void {
    if (!IS_PLAYGAMA) return;
    try {
      const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
      pg()?.setGameLoadingProgress?.(pct);
    } catch { /* ignore */ }
  },

  ready(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.loadingStop?.();
      else if (IS_POKI)  pk()?.gameLoadingFinished?.();
      else if (IS_PLAYGAMA) {
        // Report 100% then fire the loading-stopped + game-ready pair.
        pg()?.setGameLoadingProgress?.(100);
        sendPG('IN_GAME_LOADING_STOPPED', 'in_game_loading_stopped');
        sendPG('GAME_READY', 'game_ready');
        // Pre-warm ad slots so first show is instant.
        try {
          pg()?.advertisement?.preloadInterstitial?.();
          pg()?.advertisement?.preloadRewarded?.();
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  },

  gameplayStart(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.gameplayStart?.();
      else if (IS_POKI)  pk()?.gameplayStart?.();
      else if (IS_PLAYGAMA) sendPG('GAMEPLAY_STARTED', 'gameplay_started');
    } catch { /* ignore */ }
  },
  gameplayStop(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.gameplayStop?.();
      else if (IS_POKI)  pk()?.gameplayStop?.();
      else if (IS_PLAYGAMA) sendPG('GAMEPLAY_STOPPED', 'gameplay_stopped');
    } catch { /* ignore */ }
  },

  // --- Per-level lifecycle (Playgama-only for now) -------------------
  //
  // Playgama publishers and analytics consume these to reason about
  // engagement (level pass rate, average retry count, etc.). CrazyGames
  // and Poki don't have equivalents so they no-op safely.
  levelStarted(level: number): void {
    sendPG('LEVEL_STARTED', 'level_started', { level });
  },
  levelCompleted(level: number): void {
    sendPG('LEVEL_COMPLETED', 'level_completed', { level });
  },
  levelFailed(level: number): void {
    sendPG('LEVEL_FAILED', 'level_failed', { level });
  },
  levelPaused(): void {
    sendPG('LEVEL_PAUSED', 'level_paused');
  },
  levelResumed(): void {
    sendPG('LEVEL_RESUMED', 'level_resumed');
  },
  playerGotAchievement(key: string): void {
    sendPG('PLAYER_GOT_ACHIEVEMENT', 'player_got_achievement', { key });
    // Also register with Playgama's native achievements module — some
    // platforms (Yandex, VK) show a system toast for these.
    if (!IS_PLAYGAMA) return;
    try {
      const a = pg()?.achievements;
      if (a?.isSupported && a.unlock) void a.unlock(key);
    } catch { /* ignore */ }
  },

  // --- Player sign-in (Playgama) ------------------------------------

  isSignInSupported(): boolean {
    if (!IS_PLAYGAMA) return false;
    try { return pg()?.player?.isAuthorizationSupported === true; } catch { return false; }
  },

  isSignedIn(): boolean {
    if (!IS_PLAYGAMA) return false;
    try { return pg()?.player?.isAuthorized === true; } catch { return false; }
  },

  playerName(): string | null {
    if (!IS_PLAYGAMA) return null;
    try { return pg()?.player?.name ?? null; } catch { return null; }
  },

  async signIn(): Promise<boolean> {
    if (!IS_PLAYGAMA) return false;
    try {
      const p = pg()?.player;
      if (!p?.authorize) return false;
      await p.authorize();
      return p.isAuthorized === true;
    } catch { return false; }
  },

  // Fire handler(muted) whenever the host portal toggles the mute chrome
  // around our iframe. CrazyGames uses a window event; Playgama forwards
  // via bridge.platform.on(AUDIO_STATE_CHANGED). Poki has no equivalent.
  onPortalMuteChange(handler: (muted: boolean) => void): void {
    if (IS_CRAZYGAMES) {
      try {
        window.addEventListener('portalMuteChanged', (e: Event) => {
          const detail = (e as CustomEvent<{ isMuted?: boolean }>).detail;
          if (detail && typeof detail.isMuted === 'boolean') handler(detail.isMuted);
        });
        waitFor(cg).then(sdk => {
          const initial = (sdk as any)?.game?.isMuted;
          if (typeof initial === 'boolean') handler(initial);
        });
      } catch { /* ignore */ }
    } else if (IS_PLAYGAMA) {
      wireOnBridgeReady((b) => {
        const evt = b?.EVENT_NAME?.AUDIO_STATE_CHANGED ?? 'audio_state_changed';
        try {
          b.platform.on(evt, (isEnabled: unknown) => {
            if (typeof isEnabled === 'boolean') handler(!isEnabled);
          });
          // Fire immediately with the current host state so a user who
          // arrives already-muted doesn't hear a burst of audio.
          if (typeof b.platform.isAudioEnabled === 'boolean') {
            handler(!b.platform.isAudioEnabled);
          }
        } catch { /* ignore */ }
      });
    }
  },

  // Fire handler(paused) when the host opens or closes a system overlay
  // (Playgama's PAUSE_STATE_CHANGED). GameScene freezes the timer/taps
  // while paused.
  onPortalPauseChange(handler: (paused: boolean) => void): void {
    if (IS_PLAYGAMA) {
      wireOnBridgeReady((b) => {
        const evt = b?.EVENT_NAME?.PAUSE_STATE_CHANGED ?? 'pause_state_changed';
        try {
          b.platform.on(evt, (isPaused: unknown) => {
            if (typeof isPaused === 'boolean') handler(isPaused);
          });
          // Fire immediately if the host was already paused before wire.
          if (b.platform.isPaused === true) handler(true);
        } catch { /* ignore */ }
      });
    }
  },
};

// Only touch bridge.platform after bridge.isInitialized so we don't
// trigger the SDK's "Before using the SDK you must initialize it" warn.
function wireOnBridgeReady(cb: (bridge: any) => void): void {
  let attempts = 0;
  const wire = () => {
    const b: any = (window as any).bridge;
    if (b?.isInitialized && b?.platform?.on) { cb(b); return; }
    if (attempts++ < 200) setTimeout(wire, 100);
  };
  wire();
}
