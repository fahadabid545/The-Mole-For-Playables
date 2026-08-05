import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Save } from '../services/SaveService';
import { FLAGS } from '../config/BuildFlags';
import { TX } from '../objects/TextureFactory';
import { Button } from '../ui/Button';
import { Audio } from '../services/AudioService';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.text(GAME_WIDTH / 2, 100, I18n.t('levels'), {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '56px',
      color: '#fff8e1',
      stroke: '#1b5e20',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const save = Save.get();
    const cols = 5;
    const size = 110;
    const gap = 20;
    const totalW = cols * size + (cols - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + size / 2;
    const startY = 200;

    for (let i = 0; i < FLAGS.totalLevels; i++) {
      const level = i + 1;
      const c = i % cols, r = Math.floor(i / cols);
      const x = startX + c * (size + gap);
      const y = startY + r * (size + gap);
      const unlocked = level <= save.highestUnlockedLevel;

      const tile = this.add.rectangle(x, y, size, size, unlocked ? COLORS.leafMid : 0x424242, 1)
        .setStrokeStyle(4, COLORS.woodDark);
      const num = this.add.text(x, y, `${level}`, {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '40px', color: '#fffde7',
      }).setOrigin(0.5);

      const stars = save.perLevelStars[level] ?? 0;
      for (let s = 0; s < 3; s++) {
        const st = this.add.image(x - 24 + s * 24, y + 38, TX.star).setOrigin(0.5).setScale(0.28);
        if (s >= stars) st.setAlpha(0.3);
      }

      if (unlocked) {
        tile.setInteractive({ useHandCursor: true });
        tile.on('pointerdown', () => {
          Audio.play('click');
          this.scene.start('Game', { level });
        });
      } else {
        num.setText('🔒');
      }
      void num;
    }

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
  }
}
