import Phaser from 'phaser';
import { TX } from '../objects/TextureFactory';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { EventBus, EVT } from '../utils/EventBus';
import { CONSUMABLE_KINDS, CONSUMABLES, type ConsumableKind } from '../config/ConsumableConfig';
import { TS } from '../config/TextStyles';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

interface Slot {
  kind: ConsumableKind;
  container: Phaser.GameObjects.Container;
  countText: Phaser.GameObjects.Text;
  bg: Phaser.GameObjects.Arc;
}

export class ConsumableBar extends Phaser.GameObjects.Container {
  private slots: Slot[] = [];
  private activeTimers = new Map<ConsumableKind, Phaser.Time.TimerEvent>();

  constructor(scene: Phaser.Scene, y: number) {
    super(scene, 0, y);
    scene.add.existing(this);
    this.rebuild();
  }

  private rebuild(): void {
    this.slots.forEach(s => s.container.destroy());
    this.slots = [];

    const owned = CONSUMABLE_KINDS.filter(k => Save.getConsumableCount(k) > 0);
    if (owned.length === 0) return;

    const slotSize = 64;
    const gap = 8;
    const totalW = owned.length * slotSize + (owned.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + slotSize / 2;

    owned.forEach((kind, i) => {
      const x = startX + i * (slotSize + gap);
      const slot = this.makeSlot(kind, x, 0);
      this.slots.push(slot);
    });
  }

  private makeSlot(kind: ConsumableKind, x: number, y: number): Slot {
    const def = CONSUMABLES[kind];
    const c = this.scene.add.container(x, y);
    const bg = this.scene.add.circle(0, 0, 28, 0x263238, 0.85)
      .setStrokeStyle(3, 0xffb300);
    const iconKey = (TX as any)[def.icon] || TX.iconTarget;
    const icon = this.scene.add.image(0, 0, iconKey).setOrigin(0.5).setScale(0.7);
    const countBg = this.scene.add.circle(18, -18, 12, 0xef5350, 1)
      .setStrokeStyle(2, 0xffffff);
    const countText = this.scene.add.text(18, -18, `${Save.getConsumableCount(kind)}`,
      { ...TS.chipDark(), fontSize: '18px' }).setOrigin(0.5);
    c.add([bg, icon, countBg, countText]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.tryUse(kind));
    bg.on('pointerover', () => {
      this.scene.tweens.add({ targets: c, scale: 1.15, duration: 100, ease: 'Sine.Out' });
    });
    bg.on('pointerout', () => {
      this.scene.tweens.add({ targets: c, scale: 1, duration: 100, ease: 'Sine.Out' });
    });
    this.add(c);
    return { kind, container: c, countText, bg };
  }

  private tryUse(kind: ConsumableKind): void {
    if (this.activeTimers.has(kind)) {
      Audio.play('miss');
      return;
    }
    if (!Save.useConsumable(kind)) {
      Audio.play('miss');
      return;
    }
    Audio.play('extraLife');
    EventBus.emit(EVT.CONSUMABLE_USED, kind);

    const def = CONSUMABLES[kind];
    if (def.durationMs > 0) {
      const slot = this.slots.find(s => s.kind === kind);
      if (slot) {
        slot.bg.setStrokeStyle(3, 0x66bb6a);
        this.scene.tweens.add({
          targets: slot.container, scale: 1.2, duration: 200, yoyo: true, ease: 'Back.Out',
        });
      }
      const timer = this.scene.time.delayedCall(def.durationMs, () => {
        this.activeTimers.delete(kind);
        EventBus.emit(EVT.CONSUMABLE_EXPIRED, kind);
        if (slot) slot.bg.setStrokeStyle(3, 0xffb300);
        this.rebuild();
      });
      this.activeTimers.set(kind, timer);
    }

    this.rebuild();
  }

  destroy(fromScene?: boolean): void {
    this.activeTimers.forEach(t => t.remove());
    this.activeTimers.clear();
    super.destroy(fromScene);
  }
}
