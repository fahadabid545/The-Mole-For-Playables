import Phaser from 'phaser';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';

export interface PopupOpts {
  closeable?: boolean;      // shows an X in the top-right
  onCloseX?: () => void;    // fires when X is tapped (defaults to close())
}

export class Popup extends Phaser.GameObjects.Container {
  protected overlay: Phaser.GameObjects.Rectangle;
  protected panel: Phaser.GameObjects.Image;
  protected closeIcon?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, opts: PopupOpts = {}) {
    super(scene, 0, 0);
    this.overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setInteractive();
    this.panel = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.panel).setOrigin(0.5);
    this.add([this.overlay, this.panel]);
    this.setDepth(20000);
    scene.add.existing(this);

    // Entrance animation
    this.panel.setScale(0.55);
    scene.tweens.add({ targets: this.panel, scale: 1, duration: 260, ease: 'Back.Out' });
    this.overlay.setAlpha(0);
    scene.tweens.add({ targets: this.overlay, alpha: 0.65, duration: 200 });

    if (opts.closeable) {
      const panelX = this.panel.x + this.panel.displayWidth / 2 - 20;
      const panelY = this.panel.y - this.panel.displayHeight / 2 + 20;
      this.closeIcon = scene.add.image(panelX, panelY, TX.close).setOrigin(0.5)
        .setInteractive({ useHandCursor: true }).setScale(0.9);
      this.closeIcon.on('pointerdown', () => {
        Audio.play('click');
        if (opts.onCloseX) { this.close(opts.onCloseX); }
        else { this.close(); }
      });
      this.add(this.closeIcon);
    }
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
