import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { Audio } from '../services/AudioService';
import { getSeason } from '../utils/Seasonal';

export type RaccoonKind = 'normal' | 'golden' | 'bomb' | 'frozen' | 'boss' | 'cat' | 'goat';

export interface RaccoonHitResult {
  kind: RaccoonKind;
  points: number;
  finished: boolean;    // whether this hit finished the raccoon off
}

const HP_FOR: Record<RaccoonKind, number> = {
  normal: 1, golden: 1, bomb: 1, frozen: 2, boss: 3, cat: 1, goat: 1,
};

const TEXTURE_FOR: Record<RaccoonKind, string> = {
  normal: TX.raccoon,
  golden: TX.raccoonGolden,
  bomb: TX.bomb,
  frozen: TX.raccoonFrozen,
  boss: TX.raccoonBoss,
  cat: TX.cat,
  goat: TX.goat,
};

export class Raccoon extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private hat: Phaser.GameObjects.Image | null = null;
  private hpText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private maxHp = 1;
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

    if (scene.textures.exists(TX.seasonalHat)) {
      this.hat = scene.add.image(0, -60, TX.seasonalHat).setOrigin(0.5, 1).setScale(0.7);
      const hatOffset = getSeason() === 'winter' ? -10 : 0;
      this.hat.setY(-60 + hatOffset);
      this.add(this.hat);
    }

    this.hpText = scene.add.text(0, -140, '', {
      fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '28px',
      color: '#fffde7', stroke: '#3e2723', strokeThickness: 5,
    }).setOrigin(0.5).setVisible(false);
    this.add(this.hpText);

    const barW = 80;
    const barH = 10;
    const barY = -155;
    this.hpBarBg = scene.add.rectangle(0, barY, barW + 4, barH + 4, 0x263238, 0.9)
      .setOrigin(0.5).setVisible(false);
    this.hpBarFill = scene.add.rectangle(-barW / 2, barY, barW, barH, 0x66bb6a)
      .setOrigin(0, 0.5).setVisible(false);
    this.add(this.hpBarBg);
    this.add(this.hpBarFill);

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
    this.maxHp = this.hp;
    this.popState = 'rising';
    this.onHitCb = onHit;
    this.onEscapeCb = onEscape;
    this.sprite.setTexture(TEXTURE_FOR[kind]);
    this.sprite.setY(120);
    this.sprite.setScale(kind === 'boss' ? 1.2 : 1);
    this.sprite.setAngle(0);
    this.sprite.clearTint();
    const showHat = kind !== 'bomb' && kind !== 'cat' && kind !== 'goat';
    if (this.hat) this.hat.setVisible(showHat);
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
    if (this.maxHp > 1) {
      this.hpText.setText(`${this.hp}`);
      this.hpText.setVisible(true);
      this.hpBarBg.setVisible(true);
      this.hpBarFill.setVisible(true);
      const barW = 80;
      const frac = Math.max(0, this.hp / this.maxHp);
      this.hpBarFill.width = barW * frac;
      this.hpBarFill.fillColor = frac > 0.5 ? 0x66bb6a : frac > 0.25 ? 0xffb300 : 0xef5350;
    } else {
      this.hpText.setVisible(false);
      this.hpBarBg.setVisible(false);
      this.hpBarFill.setVisible(false);
    }
  }

  autoHit(): void { this.hit(); }

  private hit(): void {
    if (this.popState !== 'up') return;

    if (this.kind === 'bomb' || this.kind === 'cat' || this.kind === 'goat') {
      this.popState = 'hit';
      this.clearTimers();
      Audio.play(this.kind === 'bomb' ? 'bomb' : 'miss');
      this.onHitCb?.({ kind: this.kind, points: 0, finished: true });
      this.scene.tweens.add({ targets: this.sprite, scaleY: 0.7, scaleX: 1.15, duration: 80, yoyo: true,
        onComplete: () => this.hide() });
      return;
    }

    this.hp--;
    Audio.play('hit');
    // Flash tint on partial hit; last hit does a squash + hide
    if (this.hp > 0) {
      this.sprite.setTint(0xffffff);
      this.scene.tweens.add({ targets: this.sprite, scaleX: 1.15, scaleY: 0.9, duration: 60, yoyo: true,
        onComplete: () => this.sprite.clearTint() });
      this.updateHpBadge();
      this.scene.tweens.add({ targets: this.hpBarFill, scaleY: 1.8, duration: 80, yoyo: true });
      this.onHitCb?.({ kind: this.kind, points: 0, finished: false });
      return;
    }

    // Final hit
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
    const isPenalty = this.kind === 'bomb' || this.kind === 'cat' || this.kind === 'goat';
    if (!isPenalty) Audio.play('laugh');
    this.scene.tweens.add({
      targets: this.sprite,
      y: 120,
      duration: 160,
      ease: 'Sine.In',
      onComplete: () => {
        this.setVisible(false);
        this.popState = 'hidden';
        if (!isPenalty) this.onEscapeCb?.();
      },
    });
  }

  private hide(): void {
    this.hpText.setVisible(false);
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
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
