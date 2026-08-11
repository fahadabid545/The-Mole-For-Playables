import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';

interface Row { tex: string; label: string; effect: string; }

const ROWS: Row[] = [
  { tex: 'tx-raccoon',         label: 'Raccoon',     effect: '+10 score' },
  { tex: 'tx-raccoon-golden',  label: 'Golden Mole', effect: '+30 score' },
  { tex: 'tx-raccoon-frozen',  label: 'Frozen Mole', effect: '+20 score, 2 hits' },
  { tex: 'tx-raccoon-boss',    label: 'Boss',        effect: '+100 score, 3 hits' },
  { tex: 'tx-bomb',            label: 'Bomb',        effect: '-1 LIFE!' },
  { tex: 'tx-cat',             label: 'Cat',         effect: '-2s time, -10 score' },
  { tex: 'tx-goat',            label: 'Goat',        effect: '-2s time, -10 score' },
];

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super('HowToPlay'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'HOW TO PLAY', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    let y = 300;
    this.add.text(GAME_WIDTH / 2, y,
      'Tap raccoons as they pop out.\nCombo hits multiply your score.\nFinish the level quota before time runs out.',
      { ...TS.body('#fff5c9'), align: 'center', fontSize: '22px' }).setOrigin(0.5);
    y += 100;

    for (const row of ROWS) {
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 80, 64, 0x2b1810, 0.55)
        .setStrokeStyle(2, 0x8d6e63);
      this.add.image(80, y, row.tex).setOrigin(0, 0.5).setScale(0.35);
      this.add.text(160, y, row.label, { ...TS.h2('#fff5c9'), fontSize: '24px' }).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH - 60, y, row.effect,
        { ...TS.body('#ffd54f'), fontSize: '22px' }).setOrigin(1, 0.5);
      y += 72;
    }

    y += 20;
    this.add.text(GAME_WIDTH / 2, y,
      'Categories: Easy = 3x3.  Hard = 4x3, faster.\nSuper Hard = penalty enemies.',
      { ...TS.body('#fff5c9'), align: 'center', fontSize: '20px' }).setOrigin(0.5);

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
