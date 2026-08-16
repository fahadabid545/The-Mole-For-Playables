import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Audio } from '../services/AudioService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { fadeIn, fadeTo } from '../utils/SceneTransition';

interface EnemyEntry {
  icon: string;
  name: string;
  desc: string;
  points: string;
}

const ENEMIES: EnemyEntry[] = [
  { icon: TX.raccoon, name: 'Raccoon', desc: 'Tap to whack! Standard pest.', points: '+1' },
  { icon: TX.raccoonGolden, name: 'Golden', desc: 'Rare and fast. Worth triple.', points: '+3' },
  { icon: TX.raccoonFrozen, name: 'Frozen', desc: 'Takes 2 hits to defeat.', points: '+2' },
  { icon: TX.raccoonBoss, name: 'Boss', desc: 'Tough (3 HP), big reward!', points: '+100' },
  { icon: TX.bomb, name: 'Bomb', desc: 'Do NOT tap! You lose a life.', points: '-1 Life' },
];

export class HowToPlayScene extends Phaser.Scene {
  private listContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private minY = 0;
  private maxY = 0;
  private dragging = false;
  private lastY = 0;

  constructor() { super('HowToPlay'); }

  create(): void {
    fadeIn(this);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, I18n.t('howToPlay'), TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const topClip = 260;
    const bottomClip = 280;
    const clipH = GAME_HEIGHT - topClip - bottomClip;

    this.listContainer = this.add.container(0, topClip);
    let y = 30;

    // Rules section
    const rules = [
      'Whack raccoons before they escape!',
      'Reach the score target to win.',
      'You have limited time each level.',
      'Hit streaks build combos for bonus points.',
      'Use power-ups from the shop to help.',
    ];
    const rulesTitle = this.add.text(GAME_WIDTH / 2, y, 'Rules', TS.h2('#fff8e1')).setOrigin(0.5);
    this.listContainer.add(rulesTitle);
    y += 44;
    rules.forEach(r => {
      const t = this.add.text(60, y, r, TS.body('#fffde7')).setOrigin(0, 0.5);
      this.listContainer.add(t);
      y += 36;
    });

    // Enemy legend
    y += 30;
    const legendTitle = this.add.text(GAME_WIDTH / 2, y, 'Enemies', TS.h2('#fff8e1')).setOrigin(0.5);
    this.listContainer.add(legendTitle);
    y += 50;

    ENEMIES.forEach(e => {
      const icon = this.add.image(70, y, e.icon).setOrigin(0.5).setScale(0.65);
      const name = this.add.text(130, y - 14, e.name,
        { ...TS.h2('#fffde7'), fontSize: '28px' }).setOrigin(0, 0.5);
      const desc = this.add.text(130, y + 14, e.desc, TS.body('#bcaaa4')).setOrigin(0, 0.5);
      const pts = this.add.text(GAME_WIDTH - 50, y, e.points,
        { ...TS.hudBig('#ffca28'), fontSize: '26px' }).setOrigin(1, 0.5);
      this.listContainer.add([icon, name, desc, pts]);
      y += 80;
    });

    // Scoring section
    y += 20;
    const scoringTitle = this.add.text(GAME_WIDTH / 2, y, 'Scoring', TS.h2('#fff8e1')).setOrigin(0.5);
    this.listContainer.add(scoringTitle);
    y += 44;
    const scoring = [
      'Combo x2 at 4 hits, x3 at 8 hits.',
      'Combo resets after 3s without a hit.',
      'Earn coins from every raccoon whacked.',
      'Spend coins in the Shop on power-ups.',
    ];
    scoring.forEach(s => {
      const t = this.add.text(60, y, s, TS.body('#fffde7')).setOrigin(0, 0.5);
      this.listContainer.add(t);
      y += 36;
    });

    const contentH = y + 40;
    this.minY = Math.min(topClip, GAME_HEIGHT - bottomClip - contentH);
    this.maxY = topClip;

    const maskShape = this.make.graphics({ x: 0, y: 0 }).fillStyle(0xffffff)
      .fillRect(0, topClip, GAME_WIDTH, clipH);
    this.listContainer.setMask(maskShape.createGeometryMask());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y >= topClip && p.y <= topClip + clipH) { this.dragging = true; this.lastY = p.y; }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      const dy = p.y - this.lastY;
      this.lastY = p.y;
      this.scrollBy(dy);
    });
    this.input.on('pointerup', () => { this.dragging = false; });
    this.input.on('wheel', (_: unknown, __: unknown, ___: number, dy: number) => this.scrollBy(-dy));

    if (contentH > clipH) {
      const arrow = this.add.image(GAME_WIDTH / 2, topClip + clipH - 20, TX.arrowDown)
        .setOrigin(0.5).setScale(0.6).setAlpha(0.8);
      this.tweens.add({ targets: arrow, y: arrow.y + 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.input.once('pointerdown', () => {
        this.tweens.add({ targets: arrow, alpha: 0, duration: 300, onComplete: () => arrow.destroy() });
      });
    }

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => fadeTo(this, 'Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }

  private lastTickY = 0;
  private scrollBy(dy: number): void {
    this.scrollY += dy;
    const targetY = Math.min(this.maxY, Math.max(this.minY, this.maxY + this.scrollY));
    this.scrollY = targetY - this.maxY;
    this.listContainer.y = targetY;
    if (Math.abs(targetY - this.lastTickY) > 40) {
      this.lastTickY = targetY;
      Audio.play('tick');
    }
  }
}
