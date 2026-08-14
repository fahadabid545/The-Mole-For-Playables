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
import { Theme, type CategoryId } from '../config/Theme';
import { Popup } from '../ui/popups/Popup';

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

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 175, 'CATEGORY', TS.title()).setOrigin(0.5).setDepth(100);

    const totalStars = Save.totalStarsAcross();
    const cardStartY = 340;
    const gap = 230;
    CARDS.forEach((card, i) => {
      const y = cardStartY + i * gap;
      const unlocked = totalStars >= card.unlockStars;
      this.buildCard(y, card, unlocked, totalStars);
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }

  private buildCard(y: number, card: CategoryCard, unlocked: boolean, totalStars: number): void {
    const x = GAME_WIDTH / 2;

    // Wooden plank tile for every category — fixed display size so the
    // 3 cards line up cleanly and don't look distorted from a
    // non-uniform scale factor.
    const tile = this.add.image(x, y, TX.tileWood).setOrigin(0.5)
      .setDisplaySize(560, 170);
    if (!unlocked) tile.setTint(0x8d6e63);

    const palette = Theme.palette(card.id);
    this.add.text(x, y - 42, card.title,
      { ...TS.title(Theme.hex(palette.accent)), fontSize: '46px', strokeThickness: 6 }).setOrigin(0.5);

    if (unlocked) {
      new Button(this, x, y + 46, {
        label: 'PLAY', scale: 0.65,
        onClick: () => {
          Audio.play('click');
          this.scene.start('LevelSelect', { category: card.id });
        },
      });
    } else {
      this.add.image(x, y + 46, TX.iconLock).setOrigin(0.5).setScale(0.9);
      tile.setInteractive({ useHandCursor: true });
      tile.on('pointerdown', () => this.openLockedPopup(card, totalStars));
    }
  }

  // Locked-category popup: pretty star icon + count + how-many-more line.
  private openLockedPopup(card: CategoryCard, totalStars: number): void {
    const popup = new Popup(this, { closeable: true });
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const need = Math.max(0, card.unlockStars - totalStars);

    const title = this.add.text(cx, cy - 200, `${card.title} LOCKED`,
      { ...TS.title('#b71c1c'), fontSize: '48px', strokeThickness: 6 }).setOrigin(0.5);

    const star = this.add.image(cx, cy - 80, TX.star).setOrigin(0.5).setScale(0.9);
    this.tweens.add({ targets: star, angle: { from: -8, to: 8 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });

    const count = this.add.text(cx, cy + 20, `${totalStars} / ${card.unlockStars}`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '54px',
        color: '#ffd54f', stroke: '#3e2723', strokeThickness: 6 }).setOrigin(0.5);

    const hint = this.add.text(cx, cy + 100,
      need > 0 ? `NEED ${need} MORE STARS\nTO UNLOCK THIS CATEGORY` : 'READY TO UNLOCK',
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '24px',
        color: '#3e2723', align: 'center' }).setOrigin(0.5);

    const ok = new Button(this, cx, cy + 220, {
      label: 'OK', onClick: () => popup.close(), scale: 0.8,
    });
    popup.addContent(title, star, count, hint, ok);
  }
}
