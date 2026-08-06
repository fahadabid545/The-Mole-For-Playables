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
    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'Achievements', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const unlocked = new Set(Save.get().achievements ?? []);
    const startY = 260;
    const rowH = 82;

    ACHIEVEMENTS.forEach((a, i) => {
      const y = startY + i * rowH;
      const isDone = unlocked.has(a.id);

      // Locked rows now use a light-cream background too (was near-black
      // with grey text — unreadable). A subtle sepia tint distinguishes
      // them from the bright gold-bordered unlocked rows.
      const bgColor = isDone ? 0xfff5c9 : 0xefe0b3;
      const bgAlpha = isDone ? 0.98 : 0.95;
      const borderColor = isDone ? 0xffb300 : COLORS.woodDark;
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 60, rowH - 10, bgColor, bgAlpha)
        .setStrokeStyle(4, borderColor);
      // Each achievement has its own themed icon (medal, target, trophy,
      // shield, flame, bolt, swords, calendar) so the list doesn't just
      // repeat a generic trophy.
      const icon = this.add.image(90, y, a.icon).setOrigin(0.5).setScale(0.75);
      if (!isDone) icon.setTint(0x8d6e63);

      // Dark text on light bg for both states — always readable.
      const titleColor = isDone ? '#3e2723' : '#5d3a1a';
      const descColor  = isDone ? '#5d4037' : '#7a5a3a';
      const title = this.add.text(160, y - 16, a.title,
        { ...TS.h2(titleColor), fontSize: '30px' }).setOrigin(0, 0.5);
      const desc = this.add.text(160, y + 18, a.desc,
        TS.body(descColor)).setOrigin(0, 0.5);

      if (isDone) {
        const check = this.add.image(GAME_WIDTH - 60, y, TX.iconCheck).setOrigin(0.5);
        void check;
      }
      void bg; void title; void desc;
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
