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
  game?: {
    ready?: () => void;
    gameplayStart?: () => void;
    gameplayStop?: () => void;
  };
  platform?: {
    sendMessage?: (msg: string) => void;
  };
  PLATFORM_MESSAGE?: { GAME_READY?: string; GAMEPLAY_STARTED?: string; GAMEPLAY_STOPPED?: string };
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
        await withTimeout(b?.initialize?.(), 10000);
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
        const b = pg();
        // Newer Playgama Bridge uses platform.sendMessage(GAME_READY);
        // older builds exposed bridge.game.ready(). Call both so we
        // signal readiness regardless of which API is present.
        try { b?.game?.ready?.(); } catch { /* ignore */ }
        try {
          const msg = b?.PLATFORM_MESSAGE?.GAME_READY ?? 'game_ready';
          b?.platform?.sendMessage?.(msg);
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  },

  gameplayStart(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.gameplayStart?.();
      else if (IS_POKI)  pk()?.gameplayStart?.();
      else if (IS_PLAYGAMA) pg()?.game?.gameplayStart?.();
    } catch { /* ignore */ }
  },
  gameplayStop(): void {
    if (!IS_PORTAL) return;
    try {
      if (IS_CRAZYGAMES) cg()?.game?.gameplayStop?.();
      else if (IS_POKI)  pk()?.gameplayStop?.();
      else if (IS_PLAYGAMA) pg()?.game?.gameplayStop?.();
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
    }
  },
};
