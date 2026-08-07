import Phaser from 'phaser';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';
import { TS } from '../config/TextStyles';

export interface ButtonOpts {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ad';
  scale?: number;
  width?: number;
}

export class Button extends Phaser.GameObjects.Container {
  private baseScale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: ButtonOpts) {
    super(scene, x, y);
    this.baseScale = opts.scale ?? 1;

    const key = opts.variant === 'ad' ? TX.buttonAd : TX.button;
    const bg = scene.add.image(0, 0, key).setOrigin(0.5);
    // Label sits over the plank face; the art texture has ropes on top
    // ~34px above center, so nudge label down for centered feel on plank.
    const label = scene.add.text(0, 14, opts.label, TS.buttonLabel()).setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      scene.tweens.add({ targets: this, scale: this.baseScale * 1.06, duration: 120, ease: 'Sine.Out' });
      // Rope-sway feel: tiny back-and-forth wobble
      scene.tweens.add({ targets: this, angle: { from: -2, to: 2 }, yoyo: true, repeat: 0, duration: 180, ease: 'Sine.InOut' });
      bg.setTint(0xfff2d0);
    });
    bg.on('pointerout', () => {
      scene.tweens.killTweensOf(this);
      scene.tweens.add({ targets: this, scale: this.baseScale, angle: 0, duration: 160, ease: 'Sine.Out' });
      bg.clearTint();
    });
    bg.on('pointerdown', () => {
      Audio.play('click');
      // Plank-drop press: quick down + swing. Force-reset angle at end
      // so touch taps (which sometimes miss pointerout on scene-transition
      // buttons that don't unmount, e.g. toggles) don't leave the plank
      // visibly skewed at ~-6°.
      scene.tweens.add({ targets: this, y: this.y + 4, scale: this.baseScale * 0.94, duration: 70, yoyo: true, ease: 'Quad.Out' });
      scene.tweens.add({
        targets: this, angle: { from: -6, to: 6 },
        yoyo: true, repeat: 1, duration: 140, ease: 'Sine.InOut',
        onComplete: () => this.setAngle(0),
      });
      opts.onClick();
    });

    this.add([bg, label]);
    this.setScale(this.baseScale);
    scene.add.existing(this);
  }
}
