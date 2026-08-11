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
  unlockStars: number;
}

const CARDS: CategoryCard[] = [
  { id: 'easy',      title: 'EASY',       unlockStars: 0 },
  { id: 'hard',      title: 'HARD',       unlockStars: 30 },
  { id: 'superHard', title: 'SUPER HARD', unlockStars: 75 },
];

export class CategorySelectScene extends Phaser.Scene {
  constructor() { super('CategorySelect'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'CATEGORY', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const totalStars = Save.totalStarsAcross();

    const cardStartY = 320;
    const gap = 220;
    CARDS.forEach((card, i) => {
      const y = cardStartY + i * gap;
      const stars = Save.get().categories[card.id].totalStars;
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
    const h = 180;
    const x = GAME_WIDTH / 2;

    const palette = Theme.palette(card.id);
    const panelBg = this.add.rectangle(x, y, w, h, palette.panelBg, 0.96)
      .setStrokeStyle(6, palette.panelBorder);
    panelBg.setInteractive({ useHandCursor: unlocked });

    this.add.text(x, y - 42, card.title,
      { ...TS.title(Theme.hex(palette.accent)), fontSize: '46px', strokeThickness: 4 }).setOrigin(0.5);

    const starText = `${stars} / ${FLAGS.totalLevels * 3}`;
    this.add.image(x - 60, y + 8, TX.star).setOrigin(0.5).setScale(0.32);
    this.add.text(x - 20, y + 8, starText,
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '26px',
        color: Theme.hex(palette.textDark) }).setOrigin(0, 0.5);

    if (unlocked) {
      new Button(this, x, y + 62, {
        label: 'PLAY', scale: 0.6,
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
      const lock = this.add.image(x - 90, y + 62, TX.iconLock).setOrigin(0.5).setScale(0.75);
      this.add.text(x - 60, y + 62, `Need ${card.unlockStars} stars`,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
          color: '#ffd54f', stroke: '#000000', strokeThickness: 3 }).setOrigin(0, 0.5);
      void lock;
    }
  }
}
