import Phaser from 'phaser';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';

export interface PopupOpts {
  closeable?: boolean;
  onCloseX?: () => void;
}

// Panel + close-X live inside `panelGroup` so they scale together as
// one unit — the close icon stays glued to the panel's top-right
// corner during entrance/exit animations and at every resolution.
export class Popup extends Phaser.GameObjects.Container {
  protected overlay: Phaser.GameObjects.Rectangle;
  protected panelGroup: Phaser.GameObjects.Container;
  protected panel: Phaser.GameObjects.Image;
  protected closeIcon?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, opts: PopupOpts = {}) {
    super(scene, 0, 0);

    this.overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setInteractive();

    this.panelGroup = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.panel = scene.add.image(0, 0, TX.panel).setOrigin(0.5);
    this.panelGroup.add(this.panel);

    this.add([this.overlay, this.panelGroup]);
    this.setDepth(20000);
    scene.add.existing(this);

    // Entrance animation on the whole group
    this.panelGroup.setScale(0.55);
    scene.tweens.add({ targets: this.panelGroup, scale: 1, duration: 260, ease: 'Back.Out' });
    this.overlay.setAlpha(0);
    scene.tweens.add({ targets: this.overlay, alpha: 0.65, duration: 200 });

    if (opts.closeable) {
      const halfW = this.panel.width / 2;
      const halfH = this.panel.height / 2;
      this.closeIcon = scene.add.image(halfW - 20, -halfH + 20, TX.close).setOrigin(0.5)
        .setInteractive({ useHandCursor: true }).setScale(0.85);
      this.closeIcon.on('pointerdown', () => {
        Audio.play('click');
        if (opts.onCloseX) this.close(opts.onCloseX);
        else this.close();
      });
      this.panelGroup.add(this.closeIcon);
    }
  }

  // Popup content is added into the panelGroup with coordinates
  // RELATIVE TO PANEL CENTER (not scene). Callers that use absolute
  // coordinates for backward compat can call addContentAbsolute().
  addContent(...children: Phaser.GameObjects.GameObject[]): void {
    // Convert absolute scene coords to panel-local coords for existing callers
    for (const c of children) {
      const go = c as unknown as Phaser.GameObjects.Components.Transform;
      if (typeof go.x === 'number' && typeof go.y === 'number') {
        go.x -= GAME_WIDTH / 2;
        go.y -= GAME_HEIGHT / 2;
      }
    }
    this.panelGroup.add(children);
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
