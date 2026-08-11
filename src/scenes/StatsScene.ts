import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { ALL_MEDALS } from '../services/MedalService';

export class StatsScene extends Phaser.Scene {
  constructor() { super('Stats'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'STATS', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const topClip = 260;
    const bottomClip = 320;
    const clipH = GAME_HEIGHT - topClip - bottomClip;
    const container = this.add.container(0, topClip);

    const d = Save.get();
    const stats = d.stats;
    const rows: [string, string][] = [
      ['Raccoons whacked', String(stats.hits.raccoon)],
      ['Bosses defeated',  String(stats.bossesDefeated)],
      ['Golden mole hits', String(stats.hits.golden)],
      ['Frozen mole hits', String(stats.hits.frozen)],
      ['Bombs tapped',     String(stats.hits.bomb)],
      ['Cats tapped',      String(stats.hits.cat)],
      ['Goats tapped',     String(stats.hits.goat)],
      ['Escapes',          String(stats.escapes)],
      ['Best combo',       String(stats.bestCombo)],
      ['Levels cleared',   String(stats.levelsCleared)],
      ['Total stars',      `${Save.totalStarsAcross()} / 450`],
      ['Play streak',      `${d.playStreak.current} (best ${d.playStreak.longest})`],
      ['Challenge streak', `${d.challengeStreak}`],
      ['Best score',       String(d.bestScore)],
    ];

    const kStyle = { fontFamily: '"Arial Black", Impact, sans-serif',
      fontSize: '22px', color: '#fff8e1' };
    const vStyle = { fontFamily: '"Arial Black", Impact, sans-serif',
      fontSize: '24px', color: '#ffd54f', stroke: '#000000', strokeThickness: 3 };

    let y = 20;
    for (const [k, v] of rows) {
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 80, 40, 0x2b1810, 0.65);
      const kt = this.add.text(80, y, k, kStyle).setOrigin(0, 0.5);
      const vt = this.add.text(GAME_WIDTH - 80, y, v, vStyle).setOrigin(1, 0.5);
      container.add([bg, kt, vt]);
      y += 46;
    }

    y += 30;
    const boardBg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 60, 60, 0x5d3a1a, 0.9)
      .setStrokeStyle(4, 0xffb300);
    const boardTitle = this.add.text(GAME_WIDTH / 2, y, 'JUNGLE BOARD',
      { ...TS.title('#fff5c9'), fontSize: '36px' }).setOrigin(0.5);
    container.add([boardBg, boardTitle]);
    y += 70;

    const owned = new Set(d.medals);
    const cols = 4;
    const size = 100;
    const gap = 20;
    const startX = (GAME_WIDTH - (cols * size + (cols - 1) * gap)) / 2 + size / 2;
    ALL_MEDALS.forEach((m, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = startX + c * (size + gap);
      const yy = y + r * (size + gap + 30);
      const has = owned.has(m.id);
      const disc = this.add.circle(x, yy, size / 2, has ? 0x8d6e63 : 0x2b1810, 0.9)
        .setStrokeStyle(4, has ? 0xffd54f : 0x5d3a1a);
      const icon = this.add.image(x, yy - 4, TX.iconMedal).setOrigin(0.5).setScale(0.6);
      if (!has) icon.setAlpha(0.3);
      const label = this.add.text(x, yy + size / 2 + 6, m.title,
        { fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '14px', color: has ? '#ffd54f' : '#9e9e9e',
          align: 'center', wordWrap: { width: size + gap } }).setOrigin(0.5, 0);
      container.add([disc, icon, label]);
    });
    const rowsUsed = Math.ceil(ALL_MEDALS.length / cols);
    const contentH = y + rowsUsed * (size + gap + 30);

    const minY = Math.min(topClip, GAME_HEIGHT - bottomClip - contentH);
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

    if (contentH > clipH) {
      const hint = this.add.text(GAME_WIDTH / 2, topClip + clipH - 18, 'scroll for more',
        { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '16px',
          color: '#fff5c9' }).setOrigin(0.5).setAlpha(0.85);
      this.tweens.add({ targets: hint, y: hint.y + 6, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.InOut' });
    }

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
