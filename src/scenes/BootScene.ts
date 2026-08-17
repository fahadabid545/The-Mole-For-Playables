import Phaser from 'phaser';
import { Audio } from '../services/AudioService';
import { Portal } from '../services/Portal';
import { hydrateFromBridge } from '../services/SaveService';
import { EventBus, EVT } from '../utils/EventBus';
import { Analytics } from '../services/AnalyticsService';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  async create(): Promise<void> {
    // Init portal SDK (no-op on non-portal builds; bounded to ~2s so it
    // can never stall boot). This is also where we register the portal
    // mute-listener so CrazyGames' player-level mute stays in sync with
    // the game's own audio state.
    Portal.onPortalMuteChange((muted) => Audio.setMutedByPortal(muted));
    // System-overlay pause from the host (Playgama). GameScene listens
    // for these events and freezes the level timer / input.
    Portal.onPortalPauseChange((paused) => {
      EventBus.emit(paused ? EVT.PLATFORM_PAUSE : EVT.PLATFORM_RESUME);
    });
    // Bounded so a hung SDK init can never stall the boot sequence.
    await Promise.race([
      Portal.init(),
      new Promise(r => setTimeout(r, 10000)),
    ]);
    // Once the bridge is initialized, pull the cloud save so progress
    // follows the player across devices. Bounded so it never blocks boot.
    await Promise.race([
      hydrateFromBridge(),
      new Promise(r => setTimeout(r, 3000)),
    ]);
    Audio.init();
    Analytics.init();
    this.scene.start('Preload');
  }
}
