import Phaser from 'phaser';
import { Audio } from '../services/AudioService';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create(): void {
    Audio.init();
    this.scene.start('Preload');
  }
}
