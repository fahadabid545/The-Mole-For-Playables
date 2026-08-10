import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { Audio } from '../services/AudioService';

export type RaccoonKind = 'normal' | 'golden' | 'bomb' | 'frozen' | 'boss';

export interface RaccoonHitResult {
  kind: RaccoonKind;
  points: number;
  finished: boolean;
}

const HP_FOR: Record<RaccoonKind, number> = {
  normal: 1, golden: 1, bomb: 1, frozen: 2, boss: 3,
};

const TEXTURE_FOR: Record<RaccoonKind, string> = {
  normal: TX.raccoon,
  golden: TX.raccoonGolden,
  bomb: TX.bomb,
  frozen: TX.raccoonFrozen,
  boss: TX.raccoonBoss,
};

export class Raccoon extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private hpText: Phaser.GameObjects.Text;
  private kind: RaccoonKind = 'normal';
  private popState: 'hidden' | 'rising' | 'up' | 'hit' | 'escaping' = 'hidden';
  private hitZone: Phaser.GameObjects.Zone;
  private hp = 1;
  private onEscapeCb: (() => void) | null = null;
  private onHitCb: ((r: RaccoonHitResult) => void) | null = null;
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.sprite = scene.add.image(0, 0, TX.raccoon).setOrigin(0.5, 1);
    this.sprite.setY(30);
    this.add(this.sprite);

    this.hpText = scene.add.text(0, -140, '', {
      fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '28px',
      color: '#fffde7', stroke: '#3e2723', strokeThickness: 5,
    }).setOrigin(0.5).setVisible(false);
    this.add(this.hpText);

    this.hitZone = scene.add.zone(0, -40, 180, 180).setInteractive({ useHandCursor: true });
    this.hitZone.on('pointerdown', () => this.hit());
    this.add(this.hitZone);

    scene.add.existing(this);
    this.setDepth(y + 100);
    this.setVisible(false);
  }

  spawn(kind: RaccoonKind, visibleMs: number, onHit: (r: RaccoonHitResult) => void, onEscape: () => void): void {
    this.clearTimers();
    this.scene.tweens.killTweensOf(this.sprite);
    this.kind = kind;
    this.hp = HP_FOR[kind];
    this.popState = 'rising';
    this.onHitCb = onHit;
    this.onEscapeCb = onEscape;
    this.sprite.setTexture(TEXTURE_FOR[kind]);
    this.sprite.setY(120);
    this.sprite.setScale(kind === 'boss' ? 1.2 : 1);
    this.sprite.setAngle(0);
    this.sprite.clearTint();
    this.updateHpBadge();
    this.setVisible(true);
    Audio.play(kind === 'golden' ? 'golden' : 'squeak');

    this.scene.tweens.add({
      targets: this.sprite,
      y: kind === 'boss' ? -40 : -20,
      duration: 200,
      ease: 'Back.Out',
      onComplete: () => {
        if (this.popState !== 'rising') return;
        this.popState = 'up';
        this.timers.push(this.scene.time.delayedCall(visibleMs, () => this.escape()));
      },
    });
  }

  private updateHpBadge(): void {
    if (this.hp > 1) {
      this.hpText.setText(`${this.hp}`);
      this.hpText.setVisible(true);
    } else {
      this.hpText.setVisible(false);
    }
  }

  private hit(): void {
    if (this.popState !== 'up' && this.popState !== 'rising') return;

    if (this.kind === 'bomb') {
      this.popState = 'hit';
      this.clearTimers();
      Audio.play('bomb');
      this.onHitCb?.({ kind: 'bomb', points: 0, finished: true });
      this.scene.tweens.add({ targets: this.sprite, scaleY: 0.7, scaleX: 1.15, duration: 80, yoyo: true,
        onComplete: () => this.hide() });
      return;
    }

    this.hp--;
    Audio.play('hit');
    if (this.hp > 0) {
      this.sprite.setTint(0xffffff);
      this.scene.tweens.add({ targets: this.sprite, scaleX: 1.15, scaleY: 0.9, duration: 60, yoyo: true,
        onComplete: () => this.sprite.clearTint() });
      this.updateHpBadge();
      this.onHitCb?.({ kind: this.kind, points: 0, finished: false });
      return;
    }

    this.popState = 'hit';
    this.clearTimers();
    const pts = this.kind === 'boss' ? 100 : this.kind === 'golden' ? 3 : this.kind === 'frozen' ? 2 : 1;
    this.onHitCb?.({ kind: this.kind, points: pts, finished: true });
    this.scene.tweens.add({ targets: this.sprite, scaleY: 0.7, scaleX: 1.15, duration: 80, yoyo: true,
      onComplete: () => this.hide() });
  }

  private escape(): void {
    if (this.popState !== 'up') return;
    this.popState = 'escaping';
    if (this.kind !== 'bomb') Audio.play('laugh');
    this.scene.tweens.add({
      targets: this.sprite,
      y: 120,
      duration: 160,
      ease: 'Sine.In',
      onComplete: () => {
        this.setVisible(false);
        this.popState = 'hidden';
        if (this.kind !== 'bomb') this.onEscapeCb?.();
      },
    });
  }

  private hide(): void {
    this.hpText.setVisible(false);
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
    this.scene.tweens.killTweensOf(this.sprite);
    this.hpText.setVisible(false);
    this.popState = 'hidden';
    this.setVisible(false);
  }

  isAvailable(): boolean { return this.popState === 'hidden'; }
  getKind(): RaccoonKind { return this.kind; }
}
