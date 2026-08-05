import Phaser from 'phaser';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';

export interface ButtonOpts {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ad';
  scale?: number;
}

export class Button extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, opts: ButtonOpts) {
    super(scene, x, y);
    const key = opts.variant === 'ad' ? TX.buttonAd : TX.button;
    const bg = scene.add.image(0, 0, key).setOrigin(0.5);
    const label = scene.add.text(0, -6, opts.label, {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '34px',
      color: '#fffde7',
      stroke: '#3e2723',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5);
    this.add([bg, label]);
    if (opts.scale) this.setScale(opts.scale);

    bg.setInteractive({ useHandCursor: false });
    bg.on('pointerdown', () => {
      Audio.play('click');
      scene.tweens.add({ targets: this, scale: (opts.scale ?? 1) * 0.95, duration: 60, yoyo: true });
      opts.onClick();
    });
    scene.add.existing(this);
  }
}
