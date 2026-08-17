import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TX } from '../objects/TextureFactory';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { CATEGORIES, CATEGORY_DEFS, isCategoryUnlocked, type Category } from '../config/CategoryConfig';
import { fadeIn, fadeTo } from '../utils/SceneTransition';
import { Analytics } from '../services/AnalyticsService';

export class CategorySelectScene extends Phaser.Scene {
  constructor() { super('CategorySelect'); }

  create(): void {
    fadeIn(this);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const signBg = this.add.image(GAME_WIDTH / 2, 130, TX.signHang).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, signBg.y + 14, 'Select Category', TS.title()).setOrigin(0.5);

    const totalStars = Save.getAllStars();
    const starIcon = this.add.image(GAME_WIDTH / 2 - 60, 220, TX.star).setOrigin(0.5).setScale(0.45);
    this.add.text(starIcon.x + 22, 220, `${totalStars}`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '24px', color: '#ffd54f' }).setOrigin(0, 0.5);

    const cardW = 580;
    const cardH = 200;
    const gap = 24;
    const startY = 290;

    CATEGORIES.forEach((catId, i) => {
      const def = CATEGORY_DEFS[catId];
      const cy = startY + i * (cardH + gap) + cardH / 2;
      const unlocked = isCategoryUnlocked(catId, totalStars);
      const progress = Save.getCategoryProgress(catId);

      const bg = this.add.rectangle(GAME_WIDTH / 2, cy, cardW, cardH,
        unlocked ? 0x3e2723 : 0x263238, unlocked ? 0.88 : 0.7)
        .setStrokeStyle(3, def.accentColor).setOrigin(0.5);

      const nameText = this.add.text(GAME_WIDTH / 2 - cardW / 2 + 24, cy - 50, def.name,
        { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '38px',
          color: unlocked ? '#fff8e1' : '#9e9e9e' }).setOrigin(0, 0.5);

      const gridLabel = `${def.cols}x${def.rows} Grid`;
      this.add.text(nameText.x + nameText.width + 16, cy - 50, gridLabel,
        { fontFamily: 'sans-serif', fontSize: '18px',
          color: unlocked ? '#bcaaa4' : '#757575' }).setOrigin(0, 0.5);

      if (def.hasCat || def.hasGoat) {
        const extraY = cy - 50;
        if (def.hasCat) {
          this.add.image(GAME_WIDTH / 2 + cardW / 2 - 80, extraY, TX.iconCat)
            .setOrigin(0.5).setScale(0.7).setAlpha(unlocked ? 1 : 0.4);
        }
        if (def.hasGoat) {
          this.add.image(GAME_WIDTH / 2 + cardW / 2 - 36, extraY, TX.iconGoat)
            .setOrigin(0.5).setScale(0.7).setAlpha(unlocked ? 1 : 0.4);
        }
      }

      if (unlocked) {
        const lvl = progress.highestUnlockedLevel;
        const stars = progress.totalStars;
        const maxStars = def.levels * 3;

        this.add.text(GAME_WIDTH / 2 - cardW / 2 + 24, cy + 4,
          `Level ${Math.min(lvl, def.levels)} / ${def.levels}`,
          { fontFamily: 'sans-serif', fontSize: '20px', color: '#a5d6a7' });

        const barW = 300;
        const barH = 12;
        const barX = GAME_WIDTH / 2 - cardW / 2 + 24;
        const barY = cy + 38;
        this.add.rectangle(barX, barY, barW, barH, 0x000000, 0.4).setOrigin(0, 0.5);
        const frac = Math.min(1, stars / maxStars);
        this.add.rectangle(barX, barY, barW * frac, barH, def.accentColor, 1).setOrigin(0, 0.5);

        const starSmall = this.add.image(barX + barW + 12, barY, TX.star).setOrigin(0, 0.5).setScale(0.25);
        this.add.text(starSmall.x + 18, barY, `${stars}/${maxStars}`,
          { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffd54f' }).setOrigin(0, 0.5);

        const playBtn = new Button(this, GAME_WIDTH / 2 + cardW / 2 - 80, cy + 20, {
          label: lvl > 1 ? 'Continue' : 'Play',
          onClick: () => {
            Audio.play('click');
            Analytics.categorySelected(catId);
            fadeTo(this, 'LevelSelect', { category: catId });
          },
          scale: 0.65,
        });
      } else {
        const lockIcon = this.add.image(GAME_WIDTH / 2, cy + 10, TX.iconLock)
          .setOrigin(0.5).setScale(1.2).setAlpha(0.6);
        this.add.text(GAME_WIDTH / 2, cy + 55,
          `Requires ${def.unlockStars} stars`,
          { fontFamily: 'sans-serif', fontSize: '20px', color: '#9e9e9e' }).setOrigin(0.5);

        bg.setInteractive({ useHandCursor: false });
        bg.on('pointerdown', () => {
          Audio.play('miss');
          this.tweens.add({ targets: [bg, lockIcon], x: bg.x - 6, duration: 40, yoyo: true, repeat: 2 });
        });
      }
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 100, {
      label: I18n.t('back'),
      onClick: () => fadeTo(this, 'Menu'),
      scale: 0.85,
    });
  }
}
