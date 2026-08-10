import Phaser from 'phaser';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';

export interface PopupOpts {
  closeable?: boolean;
  onCloseX?: () => void;
}

// Panel + close-X sit inside `panelGroup` so they animate together and
// the close icon stays glued to the panel's top-right corner.
export class Popup extends Phaser.GameObjects.Container {
  protected overlay: Phaser.GameObjects.Rectangle;
  protected panelGroup: Phaser.GameObjects.Container;
  protected panel: Phaser.GameObjects.Image;
  protected closeIcon?: Phaser.GameObjects.Image;
  // Guards addContent() against double-shifting a child that already
  // moved from absolute to panel-local coords.
  private shifted = new WeakSet<Phaser.GameObjects.GameObject>();

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

    const restY = this.panelGroup.y;
    this.panelGroup.setY(restY - 260);
    this.panelGroup.setScale(0.85);
    this.panelGroup.setAngle(-6);
    scene.tweens.add({ targets: this.panelGroup, y: restY, scale: 1, duration: 320, ease: 'Back.Out' });
    scene.tweens.add({ targets: this.panelGroup, angle: { from: -6, to: 4 },
      yoyo: true, repeat: 1, duration: 220, ease: 'Sine.InOut',
      onComplete: () => this.panelGroup.setAngle(0) });
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

  // Accepts children positioned in absolute scene coords and re-parents
  // them into the panelGroup by subtracting the panel origin once.
  addContent(...children: Phaser.GameObjects.GameObject[]): void {
    for (const c of children) {
      if (this.shifted.has(c)) continue;
      const go = c as unknown as Phaser.GameObjects.Components.Transform;
      if (typeof go.x === 'number' && typeof go.y === 'number') {
        go.x -= GAME_WIDTH / 2;
        go.y -= GAME_HEIGHT / 2;
        this.shifted.add(c);
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
