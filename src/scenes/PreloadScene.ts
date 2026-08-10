import Phaser from 'phaser';
import { buildAllTextures } from '../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { I18n } from '../services/I18nService';
import { Save } from '../services/SaveService';
import { Portal } from '../services/Portal';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {}

  create(): void {
    I18n.init(Save.get().lang);
    this.cameras.main.setBackgroundColor('#0d1b0d');
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Jungle Mole', {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '72px',
      color: '#c8e6c9',
    }).setOrigin(0.5);

    buildAllTextures(this);

    // Signal ready as soon as textures build so portal init watchdogs
    // (Playgama fires at 30s) fire while the fade still runs.
    Portal.ready();

    this.tweens.add({
      targets: label, alpha: 0, duration: 300, delay: 200,
      onComplete: () => {
        Portal.ready();
        this.scene.start('Menu');
      },
    });

    void COLORS;
  }
}
