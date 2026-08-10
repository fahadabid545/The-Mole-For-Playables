import Phaser from 'phaser';
import { Audio } from '../services/AudioService';
import { Portal } from '../services/Portal';
import { hydrateFromBridge } from '../services/SaveService';
import { EventBus, EVT } from '../utils/EventBus';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  async create(): Promise<void> {
    Portal.onPortalMuteChange((muted) => Audio.setMuted(muted));
    Portal.onPortalPauseChange((paused) => {
      EventBus.emit(paused ? EVT.PLATFORM_PAUSE : EVT.PLATFORM_RESUME);
    });
    await Promise.race([
      Portal.init(),
      new Promise(r => setTimeout(r, 10000)),
    ]);
    await Promise.race([
      hydrateFromBridge(),
      new Promise(r => setTimeout(r, 3000)),
    ]);
    Audio.init();
    this.scene.start('Preload');
  }
}
