import { IS_PLAYGAMA } from '../config/BuildFlags';

// Thin wrapper around window.bridge (Playgama Bridge SDK). Safe to call
// from any build target — becomes a no-op when not on Playgama.

interface Bridge {
  initialize?: () => Promise<void>;
  game?: { ready?: () => void; gameplayStart?: () => void; gameplayStop?: () => void };
  advertisement?: unknown;
}

function b(): Bridge | undefined {
  return (window as unknown as { bridge?: Bridge }).bridge;
}

export const Playgama = {
  // Wait for the SDK to hand-off. Returns immediately if not on Playgama
  // or if the SDK isn't present within 2s (so game boot never stalls).
  async init(): Promise<void> {
    if (!IS_PLAYGAMA) return;
    const b0 = b();
    if (!b0) {
      // Poll briefly in case the CDN script hasn't hydrated yet
      for (let i = 0; i < 20 && !b(); i++) await new Promise(r => setTimeout(r, 100));
    }
    try { await b()?.initialize?.(); } catch { /* ignore */ }
  },

  // Signal the portal that the game finished loading and is playable.
  // Playgama uses this to hide its preloader and start the session clock.
  ready(): void {
    if (!IS_PLAYGAMA) return;
    try { b()?.game?.ready?.(); } catch { /* ignore */ }
  },

  // Optional — helps the portal know when a real level is running vs. UI.
  gameplayStart(): void {
    if (!IS_PLAYGAMA) return;
    try { b()?.game?.gameplayStart?.(); } catch { /* ignore */ }
  },
  gameplayStop(): void {
    if (!IS_PLAYGAMA) return;
    try { b()?.game?.gameplayStop?.(); } catch { /* ignore */ }
  },
};
