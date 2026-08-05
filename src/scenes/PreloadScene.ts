import Phaser from 'phaser';
import { buildAllTextures } from '../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {
    // Nothing to preload — placeholder art is generated in create().
    // If real assets are dropped into public/assets, load them here:
    //   this.load.image(TX.raccoon, 'assets/images/raccoon/raccoon_idle.png');
    //   ...
  }

  create(): void {
    // Splash while textures build
    this.cameras.main.setBackgroundColor('#0d1b0d');
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Jungle Mole', {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '72px',
      color: '#c8e6c9',
    }).setOrigin(0.5);

    buildAllTextures(this);

    this.tweens.add({
      targets: label, alpha: 0, duration: 300, delay: 200,
      onComplete: () => this.scene.start('Menu'),
    });

    void COLORS;
  }
}
