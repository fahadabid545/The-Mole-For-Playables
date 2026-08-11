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
  { tex: 'tx-raccoon',         label: 'Raccoon',   effect: '+10',           color: '#a5d6a7' },
  { tex: 'tx-raccoon-golden',  label: 'Golden',    effect: '+30',           color: '#ffd54f' },
  { tex: 'tx-raccoon-frozen',  label: 'Frozen',    effect: '+20 · 2 hits',  color: '#81d4fa' },
  { tex: 'tx-raccoon-boss',    label: 'Boss',      effect: '+100 · 3 hits', color: '#f8bbd0' },
  { tex: 'tx-bomb',            label: 'Bomb',      effect: '-1 LIFE',       color: '#ef5350' },
  { tex: 'tx-cat',             label: 'Cat',       effect: '-2s / -10',     color: '#ffab91' },
  { tex: 'tx-goat',            label: 'Goat',      effect: '-2s / -10',     color: '#ffab91' },
];

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super('HowToPlay'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.15);
    this.add.text(GAME_WIDTH / 2, 175, 'HOW TO PLAY',
      { ...TS.title(), fontSize: '40px', strokeThickness: 6 }).setOrigin(0.5).setDepth(100);

    // Intro on a wooden plank (same theme as rows).
    const introY = 290;
    this.add.image(GAME_WIDTH / 2, introY, TX.tileWood).setOrigin(0.5)
      .setDisplaySize(GAME_WIDTH - 80, 100);
    this.add.text(GAME_WIDTH / 2, introY,
      'Tap raccoons as they pop out.\nCombo hits multiply score.',
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
        color: '#fff8e1', align: 'center', stroke: '#3e2723', strokeThickness: 3 }).setOrigin(0.5);

    // Fixed 3-column layout per row: icon | label (left) | effect (right).
    let y = introY + 90;
    const rowH = 74;
    const iconX = 80;
    const labelX = 160;
    const effectX = GAME_WIDTH - 80;
    for (const row of ROWS) {
      y += rowH;
      this.add.image(GAME_WIDTH / 2, y, TX.tileWood).setOrigin(0.5)
        .setDisplaySize(GAME_WIDTH - 80, rowH - 10);
      this.add.image(iconX, y, row.tex).setOrigin(0.5).setScale(0.3);
      this.add.text(labelX, y, row.label,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '24px',
          color: '#fff8e1', stroke: '#3e2723', strokeThickness: 3 }).setOrigin(0, 0.5);
      this.add.text(effectX, y, row.effect,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
          color: row.color, stroke: '#3e2723', strokeThickness: 3 }).setOrigin(1, 0.5);
    }

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
