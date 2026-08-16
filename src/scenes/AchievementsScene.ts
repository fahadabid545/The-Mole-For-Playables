import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { ACHIEVEMENTS } from '../services/AchievementService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';

export class AchievementsScene extends Phaser.Scene {
  private listContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private minY = 0;
  private maxY = 0;
  private dragging = false;
  private lastY = 0;

  constructor() { super('Achievements'); }

  create(): void {
    new ParallaxJungle(this);
    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'Achievements', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const topClip = 260;
    const bottomClip = 280;
    const clipH = GAME_HEIGHT - topClip - bottomClip;

    this.listContainer = this.add.container(0, topClip);

    const unlocked = new Set(Save.get().achievements ?? []);
    const rowH = 82;

    ACHIEVEMENTS.forEach((a, i) => {
      const y = 40 + i * rowH;
      const isDone = unlocked.has(a.id);

      const bgColor = isDone ? 0xfff5c9 : 0xefe0b3;
      const bgAlpha = isDone ? 0.98 : 0.95;
      const borderColor = isDone ? 0xffb300 : COLORS.woodDark;
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 60, rowH - 10, bgColor, bgAlpha)
        .setStrokeStyle(4, borderColor);
      const icon = this.add.image(90, y, a.icon).setOrigin(0.5).setScale(0.75);
      if (!isDone) icon.setTint(0x8d6e63);

      const titleColor = isDone ? '#3e2723' : '#5d3a1a';
      const descColor  = isDone ? '#5d4037' : '#7a5a3a';
      const title = this.add.text(160, y - 16, a.title,
        { ...TS.h2(titleColor), fontSize: '30px' }).setOrigin(0, 0.5);
      const desc = this.add.text(160, y + 18, a.desc,
        TS.body(descColor)).setOrigin(0, 0.5);

      const items: Phaser.GameObjects.GameObject[] = [bg, icon, title, desc];
      if (isDone) {
        items.push(this.add.image(GAME_WIDTH - 60, y, TX.iconCheck).setOrigin(0.5));
      }
      this.listContainer.add(items);
    });

    const contentH = 40 + ACHIEVEMENTS.length * rowH;
    this.minY = Math.min(topClip, GAME_HEIGHT - bottomClip - contentH);
    this.maxY = topClip;

    const maskShape = this.make.graphics({ x: 0, y: 0 }).fillStyle(0xffffff)
      .fillRect(0, topClip, GAME_WIDTH, clipH);
    this.listContainer.setMask(maskShape.createGeometryMask());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y >= topClip && p.y <= topClip + clipH) { this.dragging = true; this.lastY = p.y; }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      const dy = p.y - this.lastY;
      this.lastY = p.y;
      this.scrollBy(dy);
    });
    this.input.on('pointerup', () => { this.dragging = false; });
    this.input.on('wheel', (_: unknown, __: unknown, ___: number, dy: number) => this.scrollBy(-dy));

    if (contentH > clipH) {
      const arrow = this.add.image(GAME_WIDTH / 2, topClip + clipH - 20, TX.arrowDown)
        .setOrigin(0.5).setScale(0.6).setAlpha(0.8);
      this.tweens.add({ targets: arrow, y: arrow.y + 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.input.once('pointerdown', () => {
        this.tweens.add({ targets: arrow, alpha: 0, duration: 300, onComplete: () => arrow.destroy() });
      });
    }

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }

  private scrollBy(dy: number): void {
    this.scrollY += dy;
    const targetY = Math.min(this.maxY, Math.max(this.minY, this.maxY + this.scrollY));
    this.scrollY = targetY - this.maxY;
    this.listContainer.y = targetY;
  }
}
