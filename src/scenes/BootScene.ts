import Phaser from 'phaser';
import { Audio } from '../services/AudioService';
import { Playgama } from '../services/PlaygamaBridge';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  async create(): Promise<void> {
    // No-op on non-Playgama builds. Bounded to ~2s so it can never stall boot.
    await Playgama.init();
    Audio.init();
    this.scene.start('Preload');
  }
}
