import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { Audio } from '../services/AudioService';

export type RaccoonKind = 'normal' | 'golden' | 'bomb';

export interface RaccoonHitResult {
  kind: RaccoonKind;
  points: number;
}

export class Raccoon extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private kind: RaccoonKind = 'normal';
  private popState: 'hidden' | 'rising' | 'up' | 'hit' | 'escaping' = 'hidden';
  private hitZone: Phaser.GameObjects.Zone;
  private onEscapeCb: (() => void) | null = null;
  private onHitCb: ((r: RaccoonHitResult) => void) | null = null;
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.sprite = scene.add.image(0, 0, TX.raccoon).setOrigin(0.5, 1);
    this.sprite.setY(30);
    this.add(this.sprite);

    this.hitZone = scene.add.zone(0, -40, 160, 160).setInteractive({ useHandCursor: true });
    this.hitZone.on('pointerdown', () => this.hit());
    this.add(this.hitZone);

    scene.add.existing(this);
    this.setDepth(y + 100);
    this.setVisible(false);
  }

  spawn(kind: RaccoonKind, visibleMs: number, onHit: (r: RaccoonHitResult) => void, onEscape: () => void): void {
    this.clearTimers();
    this.kind = kind;
    this.popState = 'rising';
    this.onHitCb = onHit;
    this.onEscapeCb = onEscape;
    this.sprite.setTexture(
      kind === 'bomb' ? TX.bomb : kind === 'golden' ? TX.raccoonGolden : TX.raccoon
    );
    this.sprite.setY(120);
    this.sprite.setScale(1);
    this.sprite.setAngle(0);
    this.setVisible(true);
    Audio.play(kind === 'golden' ? 'golden' : kind === 'bomb' ? 'squeak' : 'squeak');

    this.scene.tweens.add({
      targets: this.sprite,
      y: -20,
      duration: 180,
      ease: 'Back.Out',
      onComplete: () => {
        if (this.popState !== 'rising') return;
        this.popState = 'up';
        this.timers.push(this.scene.time.delayedCall(visibleMs, () => this.escape()));
      },
    });
  }

  private hit(): void {
    if (this.popState !== 'up' && this.popState !== 'rising') return;
    this.popState = 'hit';
    this.clearTimers();

    if (this.kind === 'bomb') {
      Audio.play('bomb');
      this.onHitCb?.({ kind: 'bomb', points: 0 });
    } else {
      Audio.play('hit');
      this.sprite.setTexture(TX.raccoonHit);
      this.onHitCb?.({ kind: this.kind, points: this.kind === 'golden' ? 3 : 1 });
    }

    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.7,
      scaleX: 1.15,
      duration: 80,
      yoyo: true,
      onComplete: () => this.hide(),
    });
  }

  private escape(): void {
    if (this.popState !== 'up') return;
    this.popState = 'escaping';
    if (this.kind === 'normal' || this.kind === 'golden') Audio.play('laugh');
    this.scene.tweens.add({
      targets: this.sprite,
      y: 120,
      duration: 150,
      ease: 'Sine.In',
      onComplete: () => {
        this.setVisible(false);
        this.popState = 'hidden';
        // Bombs escaping = no penalty; normal/golden escaping = penalty.
        if (this.kind !== 'bomb') this.onEscapeCb?.();
      },
    });
  }

  private hide(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      y: 120,
      duration: 120,
      ease: 'Sine.In',
      onComplete: () => {
        this.setVisible(false);
        this.popState = 'hidden';
      },
    });
  }

  private clearTimers(): void {
    this.timers.forEach(t => t.remove(false));
    this.timers = [];
  }

  forceHide(): void {
    this.clearTimers();
    this.popState = 'hidden';
    this.setVisible(false);
  }

  isAvailable(): boolean { return this.popState === 'hidden'; }
  getKind(): RaccoonKind { return this.kind; }
}
