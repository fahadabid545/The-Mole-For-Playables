import Phaser from 'phaser';
import { TX } from '../objects/TextureFactory';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TS } from '../config/TextStyles';

export type PowerupKind = 'freeze' | 'double' | 'auto';

export interface PowerupSlot {
  kind: PowerupKind;
  icon: string;
  container: Phaser.GameObjects.Container;
  count: Phaser.GameObjects.Text;
}

// A horizontal row of 3 power-up icons with tap-to-use + count badge.
// Emits scene event "powerup-used" with the kind for the Game scene
// to handle (freeze timer, double points, auto-hit).
export class PowerupBar extends Phaser.GameObjects.Container {
  private slots: PowerupSlot[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const defs: { kind: PowerupKind; icon: string }[] = [
      { kind: 'freeze', icon: TX.iconFreeze },
      { kind: 'double', icon: TX.iconDouble },
      { kind: 'auto',   icon: TX.iconTarget },
    ];
    defs.forEach((d, i) => this.slots.push(this.makeSlot(d.kind, d.icon, i * 88)));
    scene.add.existing(this);
    this.refresh();
  }

  private makeSlot(kind: PowerupKind, iconKey: string, xOff: number): PowerupSlot {
    const c = this.scene.add.container(xOff, 0);
    const bg = this.scene.add.circle(0, 0, 34, 0x263238, 0.85).setStrokeStyle(3, 0xffb300);
    const icon = this.scene.add.image(0, 0, iconKey).setOrigin(0.5).setScale(0.9);
    const count = this.scene.add.text(22, 22, '0',
      { ...TS.chipDark(), fontSize: '22px' }).setOrigin(0.5);
    const countBg = this.scene.add.circle(22, 22, 14, 0xef5350, 1).setStrokeStyle(2, 0xffffff);
    c.add([bg, icon, countBg, count]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.tryUse(kind));
    this.add(c);
    return { kind, icon: iconKey, container: c, count };
  }

  private tryUse(kind: PowerupKind): void {
    if (!Save.usePowerup(kind)) { Audio.play('miss'); return; }
    Audio.play('extraLife');
    this.refresh();
    this.scene.events.emit('powerup-used', kind);
  }

  refresh(): void {
    const pu = Save.get().powerups || { freeze: 0, double: 0, auto: 0 };
    this.slots.forEach(s => s.count.setText(`${(pu as any)[s.kind] ?? 0}`));
  }
}
