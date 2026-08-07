import Phaser from 'phaser';
import { Audio } from '../services/AudioService';
import { Portal } from '../services/Portal';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  async create(): Promise<void> {
    // Init portal SDK (no-op on non-portal builds; bounded to ~2s so it
    // can never stall boot). This is also where we register the portal
    // mute-listener so CrazyGames' player-level mute stays in sync with
    // the game's own audio state.
    Portal.onPortalMuteChange((muted) => Audio.setMuted(muted));
    await Portal.init();
    Audio.init();
    this.scene.start('Preload');
  }
}
