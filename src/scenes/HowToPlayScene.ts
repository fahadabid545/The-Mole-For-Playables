import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';

interface Row { tex: string; label: string; effect: string; color: string; }

const ROWS: Row[] = [
  { tex: 'tx-raccoon',         label: 'Raccoon',     effect: '+10',        color: '#a5d6a7' },
  { tex: 'tx-raccoon-golden',  label: 'Golden',      effect: '+30',        color: '#ffd54f' },
  { tex: 'tx-raccoon-frozen',  label: 'Frozen',      effect: '+20 (2 hits)', color: '#81d4fa' },
  { tex: 'tx-raccoon-boss',    label: 'Boss',        effect: '+100 (3 hits)', color: '#f8bbd0' },
  { tex: 'tx-bomb',            label: 'Bomb',        effect: '-1 LIFE',    color: '#ef5350' },
  { tex: 'tx-cat',             label: 'Cat',         effect: '-2s / -10',  color: '#ffab91' },
  { tex: 'tx-goat',            label: 'Goat',        effect: '-2s / -10',  color: '#ffab91' },
];

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super('HowToPlay'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'HOW TO PLAY', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    let y = 280;
    this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 80, 100, 0x2b1810, 0.75)
      .setStrokeStyle(3, 0x8d6e63);
    this.add.text(GAME_WIDTH / 2, y,
      'Tap raccoons as they pop out.\nCombo hits multiply score. Beat the quota before time runs out.',
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '20px',
        color: '#fff8e1', align: 'center', wordWrap: { width: GAME_WIDTH - 120 } }).setOrigin(0.5);
    y += 90;

    const rowH = 78;
    for (const row of ROWS) {
      y += rowH;
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 80, rowH - 8, 0xfff5c9, 0.94)
        .setStrokeStyle(3, 0x5d3a1a);
      this.add.image(80, y, row.tex).setOrigin(0.5).setScale(0.32);
      this.add.text(160, y, row.label,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '24px',
          color: '#3e2723' }).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH - 60, y, row.effect,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
          color: row.color, stroke: '#3e2723', strokeThickness: 3 }).setOrigin(1, 0.5);
    }

    y += rowH + 20;
    this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 80, 80, 0x2b1810, 0.75)
      .setStrokeStyle(3, 0x8d6e63);
    this.add.text(GAME_WIDTH / 2, y,
      'EASY 3x3    HARD 4x3 faster    SUPER HARD penalty enemies',
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '18px',
        color: '#ffd54f', align: 'center', wordWrap: { width: GAME_WIDTH - 100 } }).setOrigin(0.5);

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
