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
    this.add.text(GAME_WIDTH / 2, 130, 'Achievements', TS.title('#fff8e1')).setOrigin(0.5).setDepth(100);

    const unlocked = new Set(Save.get().achievements ?? []);
    const startY = 240;
    const rowH = 100;

    ACHIEVEMENTS.forEach((a, i) => {
      const y = startY + i * rowH;
      const isDone = unlocked.has(a.id);

      const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 60, rowH - 10,
        isDone ? 0xfff8e1 : 0x263238, isDone ? 0.95 : 0.75)
        .setStrokeStyle(4, isDone ? 0xffb300 : COLORS.woodDark);
      const trophy = this.add.image(90, y, TX.iconTrophy).setOrigin(0.5).setScale(0.75);
      if (!isDone) trophy.setTint(0x616161);

      const title = this.add.text(160, y - 16, a.title,
        { ...TS.h2(isDone ? '#3e2723' : '#e0e0e0'), fontSize: '30px' }).setOrigin(0, 0.5);
      const desc = this.add.text(160, y + 18, a.desc,
        TS.body(isDone ? '#5d4037' : '#bdbdbd')).setOrigin(0, 0.5);

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
