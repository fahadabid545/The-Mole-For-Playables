import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';

// Single scrollable wooden board covering how to play, scoring, and
// every enemy type in one structured pane — no floating text, no
// spread-out row planks.

interface EnemyRow {
  tex: string;
  label: string;
  effect: string;
  color: string;
  detail: string;
}

const ENEMIES: EnemyRow[] = [
  { tex: 'tx-raccoon',        label: 'Raccoon', effect: '+10',           color: '#a5d6a7',
    detail: 'The main target. Fast to whack.' },
  { tex: 'tx-raccoon-golden', label: 'Golden',  effect: '+30',           color: '#ffd54f',
    detail: 'Rare + high score. Do NOT miss it.' },
  { tex: 'tx-raccoon-frozen', label: 'Frozen',  effect: '+20 · 2 hits',  color: '#81d4fa',
    detail: 'Icy — takes two taps to break.' },
  { tex: 'tx-raccoon-boss',   label: 'Boss',    effect: '+100 · 3 hits', color: '#f8bbd0',
    detail: 'Boss levels only. Three solid hits.' },
  { tex: 'tx-bomb',           label: 'Bomb',    effect: '-1 LIFE',       color: '#ef5350',
    detail: 'AVOID. Costs a whole life if tapped.' },
  { tex: 'tx-cat',            label: 'Cat',     effect: '-2s / -10',     color: '#ffab91',
    detail: 'Super Hard only. Time + score penalty.' },
  { tex: 'tx-goat',           label: 'Goat',    effect: '-2s / -10',     color: '#ffab91',
    detail: 'Super Hard only. Time + score penalty.' },
];

const RULES: string[] = [
  'Tap raccoons the moment they pop out.',
  'Combo hits MULTIPLY your score — chain 4 for ×2, 8+ for ×3.',
  'Miss a raccoon and it escapes — combo resets.',
  'Every 5 escaped raccoons cost you a life.',
  'Clear the hit quota before the timer runs out to win.',
  '3 stars if you finish with 50%+ time left, 2 stars for 20%+, 1 star otherwise.',
];

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super('HowToPlay'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.15);
    this.add.text(GAME_WIDTH / 2, 175, 'HOW TO PLAY',
      { ...TS.title(), fontSize: '40px', strokeThickness: 6 }).setOrigin(0.5).setDepth(100);

    const topClip = 300;
    const bottomClip = 300;
    const clipH = GAME_HEIGHT - topClip - bottomClip;
    const container = this.add.container(0, topClip);

    // One tall wooden board that holds everything in structured order.
    const boardW = GAME_WIDTH - 60;
    const rules_start = 20;
    const rules_lh = 44;
    const heading_h = 60;
    const enemy_h = 90;
    const contentH =
      heading_h + rules_start + RULES.length * rules_lh + 40 +
      heading_h + ENEMIES.length * enemy_h + 40;

    const board = this.add.image(GAME_WIDTH / 2, contentH / 2, TX.tileWood).setOrigin(0.5)
      .setDisplaySize(boardW, contentH);
    container.add(board);

    // ---- HOW TO PLAY heading + rule list ----
    let y = 30;
    const h1 = this.add.text(GAME_WIDTH / 2, y, 'RULES',
      { ...TS.h2('#ffd54f'), fontSize: '32px', stroke: '#3e2723', strokeThickness: 4 })
      .setOrigin(0.5);
    container.add(h1);
    y += 50;
    for (const rule of RULES) {
      const dot = this.add.text(60, y, '•',
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '26px',
          color: '#ffd54f', stroke: '#3e2723', strokeThickness: 3 }).setOrigin(0, 0.5);
      const t = this.add.text(90, y, rule,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
          color: '#fff8e1', stroke: '#3e2723', strokeThickness: 3,
          wordWrap: { width: boardW - 130 } }).setOrigin(0, 0.5);
      container.add([dot, t]);
      // Advance by the actual height the wrapped text used.
      y += Math.max(rules_lh, t.height + 12);
    }

    // Divider
    y += 20;
    const div = this.add.rectangle(GAME_WIDTH / 2, y, boardW - 80, 3, 0x3e2723, 0.6);
    container.add(div);
    y += 30;

    // ---- Enemy legend ----
    const h2 = this.add.text(GAME_WIDTH / 2, y, 'ENEMIES',
      { ...TS.h2('#ffd54f'), fontSize: '32px', stroke: '#3e2723', strokeThickness: 4 })
      .setOrigin(0.5);
    container.add(h2);
    y += 50;

    const iconX = 90;
    const labelX = 160;
    const effectX = GAME_WIDTH - 40;
    for (const row of ENEMIES) {
      const icon = this.add.image(iconX, y + 10, row.tex).setOrigin(0.5)
        .setDisplaySize(60, 60);
      const name = this.add.text(labelX, y, row.label,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
          color: '#fff8e1', stroke: '#3e2723', strokeThickness: 3 }).setOrigin(0, 0);
      const detail = this.add.text(labelX, y + 30, row.detail,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '15px',
          color: '#fff5c9', stroke: '#3e2723', strokeThickness: 2,
          wordWrap: { width: GAME_WIDTH - labelX - 130 } }).setOrigin(0, 0);
      const effect = this.add.text(effectX, y + 12, row.effect,
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '18px',
          color: row.color, stroke: '#3e2723', strokeThickness: 3 }).setOrigin(1, 0);
      container.add([icon, name, detail, effect]);
      y += enemy_h;
    }

    // Scroll setup
    const totalH = y + 40;
    const minY = Math.min(topClip, GAME_HEIGHT - bottomClip - totalH);
    const maxY = topClip;
    const mask = this.make.graphics({ x: 0, y: 0 }).fillStyle(0xffffff)
      .fillRect(0, topClip, GAME_WIDTH, clipH);
    container.setMask(mask.createGeometryMask());

    let scrollY = 0, dragging = false, lastY = 0;
    const scrollBy = (dy: number) => {
      scrollY += dy;
      const t = Math.min(maxY, Math.max(minY, maxY + scrollY));
      scrollY = t - maxY;
      container.y = t;
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y >= topClip && p.y <= topClip + clipH) { dragging = true; lastY = p.y; }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown) return;
      const dy = p.y - lastY; lastY = p.y; scrollBy(dy);
    });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('wheel', (_: unknown, __: unknown, ___: number, dy: number) => scrollBy(-dy));

    // Scroll hint arrow
    const arrow = this.add.text(GAME_WIDTH - 30, topClip + clipH - 40, '▼',
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '32px',
        color: '#ffd54f', stroke: '#3e2723', strokeThickness: 4 }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: arrow, y: '+=6', yoyo: true, repeat: -1, duration: 700, ease: 'Sine.InOut' });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
