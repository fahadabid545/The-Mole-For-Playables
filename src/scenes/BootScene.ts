import Phaser from 'phaser';
import { Audio } from '../services/AudioService';
import { Portal } from '../services/Portal';
import { hydrateFromBridge } from '../services/SaveService';
import { EventBus, EVT } from '../utils/EventBus';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  async create(): Promise<void> {
    Portal.onPortalMuteChange((muted) => Audio.setMuted(muted, false));
    Portal.onPortalPauseChange((paused) => {
      EventBus.emit(paused ? EVT.PLATFORM_PAUSE : EVT.PLATFORM_RESUME);
    });
    // Cap portal init + cloud hydrate more tightly so a slow SDK never
    // blocks first-frame beyond a couple of seconds.
    await Promise.race([
      Portal.init(),
      new Promise(r => setTimeout(r, 3000)),
    ]);
    await Promise.race([
      hydrateFromBridge(),
      new Promise(r => setTimeout(r, 1500)),
    ]);
    Audio.init();
    this.scene.start('Preload');
  }
}
