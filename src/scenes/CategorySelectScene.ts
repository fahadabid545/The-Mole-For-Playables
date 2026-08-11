import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { FLAGS } from '../config/BuildFlags';
import { Theme, type CategoryId } from '../config/Theme';

interface CategoryCard {
  id: CategoryId;
  title: string;
  tagline: string;
  unlockStars: number;
}

const CARDS: CategoryCard[] = [
  { id: 'easy',      title: 'EASY',       tagline: '3x3 holes  |  chill pace',            unlockStars: 0 },
  { id: 'hard',      title: 'HARD',       tagline: '4x3 holes  |  faster spawns',         unlockStars: 30 },
  { id: 'superHard', title: 'SUPER HARD', tagline: 'Cats and goats cost time and score',  unlockStars: 75 },
];

export class CategorySelectScene extends Phaser.Scene {
  constructor() { super('CategorySelect'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'CATEGORY', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const easyStars = Save.get().categories.easy.totalStars;
    const hardStars = Save.get().categories.hard.totalStars;
    const totalStars = Save.totalStarsAcross();

    const cardStartY = 340;
    const gap = 260;
    CARDS.forEach((card, i) => {
      const y = cardStartY + i * gap;
      const stars = card.id === 'easy' ? easyStars
                  : card.id === 'hard' ? hardStars
                  : Save.get().categories.superHard.totalStars;
      const unlockedByStars = totalStars >= card.unlockStars;
      const unlocked = card.id === 'easy' || unlockedByStars;
      this.buildCard(y, card, stars, unlocked);
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
  }

  private buildCard(y: number, card: CategoryCard, stars: number, unlocked: boolean): void {
    const w = GAME_WIDTH - 120;
    const h = 220;
    const x = GAME_WIDTH / 2;

    const palette = Theme.palette(card.id);
    const panelBg = this.add.rectangle(x, y, w, h, palette.panelBg, 0.96)
      .setStrokeStyle(6, palette.panelBorder);
    panelBg.setInteractive({ useHandCursor: unlocked });

    this.add.text(x, y - 60, card.title,
      { ...TS.title(Theme.hex(palette.accent)), fontSize: '56px' }).setOrigin(0.5);
    this.add.text(x, y - 8, card.tagline,
      { ...TS.body(Theme.hex(palette.textDark)), fontSize: '22px', align: 'center' }).setOrigin(0.5);

    const starLabel = `${stars} / ${FLAGS.totalLevels * 3} stars`;
    this.add.text(x, y + 34, starLabel,
      { ...TS.body(Theme.hex(palette.textDark)), fontSize: '22px' }).setOrigin(0.5);
    this.add.image(x - 90, y + 36, TX.star).setOrigin(0.5).setScale(0.28);

    if (unlocked) {
      new Button(this, x, y + 82, {
        label: 'PLAY', scale: 0.65,
        onClick: () => {
          Audio.play('click');
          this.scene.start('LevelSelect', { category: card.id });
        },
      });
      panelBg.on('pointerdown', () => {
        Audio.play('click');
        this.scene.start('LevelSelect', { category: card.id });
      });
    } else {
      this.add.image(x - 30, y + 82, TX.iconLock).setOrigin(0.5).setScale(0.9);
      this.add.text(x + 10, y + 82, `Need ${card.unlockStars} stars total`,
        { ...TS.body('#3e2723'), fontSize: '22px' }).setOrigin(0, 0.5);
    }
  }
}
