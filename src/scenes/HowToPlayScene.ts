import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';

// Compact, scan-friendly game guide. Three sections stacked on one
// clean rounded panel (no bolt-y wooden plank so text never fights
// with decorative rivets):
//   1. SCORING     — icon | name | points for the good enemies
//   2. WATCH OUT   — icon | name | penalty for the danger enemies
//   3. QUICK TIPS  — three high-signal lines the player actually needs
// Everything fits on screen without scrolling on a 720x1280 viewport.

interface Row {
  tex: string;
  label: string;
  effect: string;
  effectColor: string;
}

const SCORE_ROWS: Row[] = [
  { tex: 'tx-raccoon',        label: 'Raccoon', effect: '+10',           effectColor: '#a5d6a7' },
  { tex: 'tx-raccoon-golden', label: 'Golden',  effect: '+30',           effectColor: '#ffd54f' },
  { tex: 'tx-raccoon-frozen', label: 'Frozen',  effect: '+20  ·  2 hits', effectColor: '#81d4fa' },
  { tex: 'tx-raccoon-boss',   label: 'Boss',    effect: '+100 · 3 hits',  effectColor: '#f8bbd0' },
];

const DANGER_ROWS: Row[] = [
  { tex: 'tx-bomb', label: 'Bomb', effect: '-1 LIFE',  effectColor: '#ef5350' },
  { tex: 'tx-cat',  label: 'Cat',  effect: '-2s / -10', effectColor: '#ffab91' },
  { tex: 'tx-goat', label: 'Goat', effect: '-2s / -10', effectColor: '#ffab91' },
];

const TIPS: { icon: string; text: string; color: string }[] = [
  { icon: '★',  text: 'Chain hits for combos — x2 at 4, x3 at 8',  color: '#ffd54f' },
  { icon: '♥',  text: 'Every 5 escapes costs a life',              color: '#ef5350' },
  { icon: '⏱', text: 'Finish fast — more time left = more stars', color: '#81d4fa' },
];

const PANEL_FILL   = 0x3a2410;
const PANEL_STROKE = 0x1c0e05;

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super('HowToPlay'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.15);
    this.add.text(GAME_WIDTH / 2, 175, 'HOW TO PLAY',
      { ...TS.title(), fontSize: '40px', strokeThickness: 6 }).setOrigin(0.5).setDepth(100);

    // Panel spans just below the title down to just above the BACK
    // button, so all three sections (scoring, watch-out, tips) fit
    // without scrolling.
    const panelX = 40;
    const panelY = 240;
    const panelW = GAME_WIDTH - 80;
    const panelH = GAME_HEIGHT - panelY - 300;
    this.add.rectangle(panelX, panelY, panelW, panelH, PANEL_FILL, 0.92)
      .setOrigin(0, 0).setStrokeStyle(6, PANEL_STROKE);

    const centerX = GAME_WIDTH / 2;
    const iconX   = panelX + 60;
    const nameX   = panelX + 130;
    const effectX = panelX + panelW - 30;

    let y = panelY + 24;

    // ---- SCORING ----
    this.section(centerX, y, 'SCORING', '#ffd54f');
    y += 46;
    for (const row of SCORE_ROWS) {
      this.enemyRow(iconX, nameX, effectX, y, row);
      y += 56;
    }

    // Divider
    y += 4;
    this.add.rectangle(centerX, y, panelW - 80, 3, 0x8d6e63, 0.7);
    y += 14;

    // ---- WATCH OUT ----
    this.section(centerX, y, 'WATCH OUT', '#ef5350');
    y += 46;
    for (const row of DANGER_ROWS) {
      this.enemyRow(iconX, nameX, effectX, y, row);
      y += 56;
    }

    // Divider
    y += 4;
    this.add.rectangle(centerX, y, panelW - 80, 3, 0x8d6e63, 0.7);
    y += 14;

    // ---- QUICK TIPS ----
    this.section(centerX, y, 'QUICK TIPS', '#a5d6a7');
    y += 44;
    for (const tip of TIPS) {
      this.tipRow(panelX + 40, panelX + panelW - 30, y, tip);
      y += 44;
    }

    new Button(this, centerX, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }

  private section(cx: number, y: number, label: string, color: string): void {
    this.add.text(cx, y, label,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '30px',
        color, stroke: '#3e2723', strokeThickness: 5 }).setOrigin(0.5, 0);
  }

  private enemyRow(iconX: number, nameX: number, effectX: number, y: number, row: Row): void {
    this.add.image(iconX, y + 22, row.tex).setOrigin(0.5).setDisplaySize(52, 52);
    this.add.text(nameX, y + 22, row.label,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '26px',
        color: '#fff8e1', stroke: '#3e2723', strokeThickness: 4 }).setOrigin(0, 0.5);
    this.add.text(effectX, y + 22, row.effect,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '24px',
        color: row.effectColor, stroke: '#3e2723', strokeThickness: 4 }).setOrigin(1, 0.5);
  }

  private tipRow(x: number, endX: number, y: number,
                 tip: { icon: string; text: string; color: string }): void {
    this.add.text(x, y, tip.icon,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '32px',
        color: tip.color, stroke: '#3e2723', strokeThickness: 4 }).setOrigin(0, 0);
    this.add.text(x + 44, y + 4, tip.text,
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '20px',
        color: '#fff8e1', stroke: '#3e2723', strokeThickness: 3,
        wordWrap: { width: endX - (x + 44) } }).setOrigin(0, 0);
  }
}
