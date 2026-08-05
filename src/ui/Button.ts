import Phaser from 'phaser';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';
import { TS } from '../config/TextStyles';

export interface ButtonOpts {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ad';
  scale?: number;   // 1 = full width (~380px). Small buttons use 0.75.
  width?: number;   // optional override
}

// Every button in the game funnels through here so they share:
// - the same 380px x 108px art
// - hover-grow to 1.06 on desktop (touch devices skip the tween)
// - press-down bounce to 0.95
// - a click SFX
export class Button extends Phaser.GameObjects.Container {
  private baseScale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: ButtonOpts) {
    super(scene, x, y);
    this.baseScale = opts.scale ?? 1;

    const key = opts.variant === 'ad' ? TX.buttonAd : TX.button;
    const bg = scene.add.image(0, 0, key).setOrigin(0.5);
    const label = scene.add.text(0, -6, opts.label, TS.buttonLabel()).setOrigin(0.5);

    // Tight hit area matching the button art (380x108)
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      scene.tweens.add({ targets: this, scale: this.baseScale * 1.06, duration: 120, ease: 'Sine.Out' });
      bg.setTint(0xf5fff5);
    });
    bg.on('pointerout', () => {
      scene.tweens.add({ targets: this, scale: this.baseScale, duration: 120, ease: 'Sine.Out' });
      bg.clearTint();
    });
    bg.on('pointerdown', () => {
      Audio.play('click');
      scene.tweens.add({ targets: this, scale: this.baseScale * 0.94, duration: 60, yoyo: true, ease: 'Quad.Out' });
      opts.onClick();
    });

    this.add([bg, label]);
    this.setScale(this.baseScale);
    scene.add.existing(this);
  }
}
