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
  constructor() { super('Achievements'); }

  create(): void {
    new ParallaxJungle(this);
    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 180, 'ACHIEVE-\nMENTS', TS.title()).setOrigin(0.5).setDepth(100);

    const unlocked = new Set(Save.get().achievements ?? []);
    const topClip = 260;
    const bottomClip = 300;
    const clipH = GAME_HEIGHT - topClip - bottomClip;
    const container = this.add.container(0, topClip);
    const rowH = 82;

    ACHIEVEMENTS.forEach((a, i) => {
      const y = i * rowH + rowH / 2;
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

      container.add([bg, icon, title, desc]);
      if (isDone) {
        const check = this.add.image(GAME_WIDTH - 60, y, TX.iconCheck).setOrigin(0.5);
        container.add(check);
      }
    });

    const contentH = ACHIEVEMENTS.length * rowH;
    const minY = Math.min(topClip, GAME_HEIGHT - bottomClip - contentH);
    const maxY = topClip;
    const mask = this.make.graphics({ x: 0, y: 0 }).fillStyle(0xffffff)
      .fillRect(0, topClip, GAME_WIDTH, clipH);
    container.setMask(mask.createGeometryMask());

    let scrollY = 0, dragging = false, lastY = 0;
    const scrollBy = (dy: number) => {
      scrollY += dy;
      const t = Math.min(maxY, Math.max(minY, maxY + scrollY));
      scrollY = t - maxY;
      container.y = t;
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y >= topClip && p.y <= topClip + clipH) { dragging = true; lastY = p.y; }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown) return;
      const dy = p.y - lastY; lastY = p.y; scrollBy(dy);
    });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('wheel', (_: unknown, __: unknown, ___: number, dy: number) => scrollBy(-dy));

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('JungleBoard'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
