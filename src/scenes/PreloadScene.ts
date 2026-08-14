import Phaser from 'phaser';
import { buildAllTextures } from '../objects/TextureFactory';
import { loadSpriteOverrides } from '../objects/SpriteOverrides';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { I18n } from '../services/I18nService';
import { Save } from '../services/SaveService';
import { Portal } from '../services/Portal';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {}

  async create(): Promise<void> {
    I18n.init(Save.get().lang);
    this.cameras.main.setBackgroundColor('#0d1b0d');
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Jungle Mole', {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '72px',
      color: '#c8e6c9',
    }).setOrigin(0.5);

    // Load any real sprite PNGs first, then let TextureFactory fill in
    // primitives for anything that wasn't overridden.
    await loadSpriteOverrides(this);
    buildAllTextures(this);

    Portal.ready();

    this.tweens.add({
      targets: label, alpha: 0, duration: 300, delay: 200,
      onComplete: () => this.scene.start('Menu'),
    });

    void COLORS;
  }
}
