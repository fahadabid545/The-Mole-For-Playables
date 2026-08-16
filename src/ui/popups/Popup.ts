import Phaser from 'phaser';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';

export type PopupEntrance = 'swing' | 'bounce' | 'slide-up' | 'zoom';

export interface PopupOpts {
  closeable?: boolean;
  onCloseX?: () => void;
  entrance?: PopupEntrance;
}

// Panel + close-X live inside `panelGroup` so they scale together as
// one unit — the close icon stays glued to the panel's top-right
// corner during entrance/exit animations and at every resolution.
export class Popup extends Phaser.GameObjects.Container {
  protected overlay: Phaser.GameObjects.Rectangle;
  protected panelGroup: Phaser.GameObjects.Container;
  protected panel: Phaser.GameObjects.Image;
  protected closeIcon?: Phaser.GameObjects.Image;
  // Tracks children already shifted from absolute to panel-local coords
  // so a double addContent() call can't push them off-screen.
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

    this.overlay.setAlpha(0);
    scene.tweens.add({ targets: this.overlay, alpha: 0.65, duration: 200 });
    Audio.play('click');
    this.playEntrance(scene, opts.entrance ?? 'swing');

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

  private playEntrance(scene: Phaser.Scene, style: PopupEntrance): void {
    const restY = this.panelGroup.y;
    switch (style) {
      case 'bounce':
        this.panelGroup.setScale(0);
        scene.tweens.add({ targets: this.panelGroup, scale: 1, duration: 380, ease: 'Back.Out' });
        break;
      case 'slide-up':
        this.panelGroup.setY(restY + 400);
        this.panelGroup.setAlpha(0);
        scene.tweens.add({ targets: this.panelGroup, y: restY, alpha: 1, duration: 320, ease: 'Cubic.Out' });
        break;
      case 'zoom':
        this.panelGroup.setScale(2);
        this.panelGroup.setAlpha(0);
        scene.tweens.add({ targets: this.panelGroup, scale: 1, alpha: 1, duration: 280, ease: 'Cubic.Out' });
        break;
      case 'swing':
      default:
        this.panelGroup.setY(restY - 260);
        this.panelGroup.setScale(0.85);
        this.panelGroup.setAngle(-6);
        scene.tweens.add({ targets: this.panelGroup, y: restY, scale: 1, duration: 320, ease: 'Back.Out' });
        scene.tweens.add({ targets: this.panelGroup, angle: { from: -6, to: 4 },
          yoyo: true, repeat: 1, duration: 220, ease: 'Sine.InOut',
          onComplete: () => this.panelGroup.setAngle(0) });
        break;
    }
  }

  // Popup content is added into the panelGroup with coordinates
  // RELATIVE TO PANEL CENTER (not scene). Callers that use absolute
  // coordinates for backward compat can call addContentAbsolute().
  addContent(...children: Phaser.GameObjects.GameObject[]): void {
    // Convert absolute scene coords to panel-local coords for existing
    // callers. Guarded so passing the same object twice (or re-parenting
    // an already-shifted child) can't double-subtract the offset.
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
