import { IS_CRAZYGAMES, IS_POKI, IS_PLAYGAMA, IS_PORTAL } from '../config/BuildFlags';

// Unified facade over the three portal SDKs (CrazyGames, Poki, Playgama).
// Every method is safe to call from any build target — on non-portal
// builds it's a no-op, and on portal builds any missing SDK method (bad
// version, CDN blocked, embedded on a non-portal host) is caught so it
// can never crash the game.

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
interface PGBridge {
  initialize?: () => Promise<void>;
  isInitialized?: boolean;
  platform?: {
    sendMessage?: (msg: string) => Promise<unknown>;
  };
  PLATFORM_MESSAGE?: {
    GAME_READY?: string;
    IN_GAME_LOADING_STARTED?: string;
    IN_GAME_LOADING_STOPPED?: string;
    GAMEPLAY_STARTED?: string;
    GAMEPLAY_STOPPED?: string;
  };
  advertisement?: {
    showInterstitial?: (opts: { callbacks: Record<string, () => void> }) => void;
    showRewarded?:     (opts: { callbacks: Record<string, () => void> }) => void;
    showBanner?: () => void;
    hideBanner?: () => void;
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

// Poll for an SDK global up to `timeoutMs` — some CDN scripts hydrate
// after the module code runs.
async function waitFor<T>(get: () => T | undefined, timeoutMs = 2000): Promise<T | undefined> {
  const step = 100;
  for (let waited = 0; waited < timeoutMs; waited += step) {
    const v = get();
    if (v) return v;
    await new Promise(r => setTimeout(r, step));
  }
  return get();
}

// Reject-on-timeout wrapper so a hung SDK init call can never block boot.
function withTimeout<T>(p: Promise<T> | undefined, ms: number): Promise<T | void> {
  if (!p) return Promise.resolve();
  return Promise.race([
    p,
    new Promise<void>(resolve => setTimeout(resolve, ms)),
  ]);
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
        // Never wrap initialize in a soft timeout: bridge.platform is
        // only fully wired to the host after initialize resolves, so a
        // premature timeout would let sendMessage(GAME_READY) hit an
        // uninitialised platform bridge and silently drop the message.
        // The BootScene guards the outer 10s hard cap.
        await b.initialize();
      }
    } catch { /* ignore — never let SDK errors break boot */ }
  },

  // Called after Preload finishes and Menu is about to appear.
  ready(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.loadingStop?.();
      else if (IS_POKI)  pk()?.gameLoadingFinished?.();
      else if (IS_PLAYGAMA) {
        // Canonical Playgama Bridge v2 required step: signal GAME_READY.
        // Internally the platform module guards against double-send, so
        // calling this from the two Preload hooks is safe.
        const b = pg();
        const msg = b?.PLATFORM_MESSAGE?.GAME_READY ?? 'game_ready';
        b?.platform?.sendMessage?.(msg);
      }
    } catch { /* ignore */ }
  },

  gameplayStart(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.gameplayStart?.();
      else if (IS_POKI)  pk()?.gameplayStart?.();
      else if (IS_PLAYGAMA) {
        const b = pg();
        const msg = b?.PLATFORM_MESSAGE?.GAMEPLAY_STARTED ?? 'gameplay_started';
        b?.platform?.sendMessage?.(msg);
      }
    } catch { /* ignore */ }
  },
  gameplayStop(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.gameplayStop?.();
      else if (IS_POKI)  pk()?.gameplayStop?.();
      else if (IS_PLAYGAMA) {
        const b = pg();
        const msg = b?.PLATFORM_MESSAGE?.GAMEPLAY_STOPPED ?? 'gameplay_stopped';
        b?.platform?.sendMessage?.(msg);
      }
    } catch { /* ignore */ }
  },

  // --- Portal-driven mute --------------------------------------------
  // CrazyGames exposes a global "mute audio" toggle in their embed. If
  // the player toggles it we want our AudioService to follow. Register
  // a listener here that the caller (BootScene) wires to Audio.setMuted.
  // Poki has no equivalent — theirs is game-side only.

  onPortalMuteChange(handler: (muted: boolean) => void): void {
    if (IS_CRAZYGAMES) {
      try {
        // CrazyGames SDK v3 dispatches a "portalMuteChange" custom event on window.
        window.addEventListener('portalMuteChanged', (e: Event) => {
          const detail = (e as CustomEvent<{ isMuted?: boolean }>).detail;
          if (detail && typeof detail.isMuted === 'boolean') handler(detail.isMuted);
        });
      } catch { /* ignore */ }
    } else if (IS_PLAYGAMA) {
      // Playgama Bridge forwards the host's audio state via
      // platform.on(AUDIO_STATE_CHANGED, isEnabled: boolean). We only
      // wire the listener once the bridge finishes initialising —
      // .platform is a module accessor that becomes usable after
      // Portal.init() awaits bridge.initialize(). Poll briefly since
      // this can be called from BootScene before init resolves.
      wireOnBridgeReady((b) => {
        const evt = b?.EVENT_NAME?.AUDIO_STATE_CHANGED ?? 'audio_state_changed';
        try {
          b.platform.on(evt, (isEnabled: unknown) => {
            if (typeof isEnabled === 'boolean') handler(!isEnabled);
          });
        } catch { /* ignore */ }
      });
    }
  },

  // Called from BootScene. Fires `handler(true)` when the platform
  // opens a system overlay / pauses the game (Playgama's
  // PAUSE_STATE_CHANGED), and `handler(false)` when it resumes.
  onPortalPauseChange(handler: (paused: boolean) => void): void {
    if (IS_PLAYGAMA) {
      wireOnBridgeReady((b) => {
        const evt = b?.EVENT_NAME?.PAUSE_STATE_CHANGED ?? 'pause_state_changed';
        try {
          b.platform.on(evt, (isPaused: unknown) => {
            if (typeof isPaused === 'boolean') handler(isPaused);
          });
          // Fire immediately if the host already paused us before this
          // listener attached (e.g. overlay opened during boot).
          if (b.platform.isPaused === true) handler(true);
        } catch { /* ignore */ }
      });
    }
  },
};

// Wait for `bridge.isInitialized === true` before invoking cb with the
// bridge. Only touches `bridge.platform` after init so we don't spam
// the SDK's "Before using the SDK you must initialize it" warning.
function wireOnBridgeReady(cb: (bridge: any) => void): void {
  let attempts = 0;
  const wire = () => {
    const b: any = (window as any).bridge;
    if (b?.isInitialized && b?.platform?.on) { cb(b); return; }
    if (attempts++ < 200) setTimeout(wire, 100);
  };
  wire();
}
