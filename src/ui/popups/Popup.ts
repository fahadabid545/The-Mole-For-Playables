import Phaser from 'phaser';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';

export class Popup extends Phaser.GameObjects.Container {
  protected overlay: Phaser.GameObjects.Rectangle;
  protected panel: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setInteractive();
    this.panel = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.panel).setOrigin(0.5);
    this.add([this.overlay, this.panel]);
    this.setDepth(20000);
    scene.add.existing(this);

    this.panel.setScale(0.6);
    scene.tweens.add({ targets: this.panel, scale: 1, duration: 220, ease: 'Back.Out' });
    this.overlay.setAlpha(0);
    scene.tweens.add({ targets: this.overlay, alpha: 0.55, duration: 200 });
  }

  addContent(...children: Phaser.GameObjects.GameObject[]): void {
    this.add(children);
  }

  close(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 180,
      onComplete: () => { this.destroy(); onComplete?.(); },
    });
  }
}
