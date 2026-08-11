import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';

export class StatsScene extends Phaser.Scene {
  constructor() { super('Stats'); }

  create(): void {
    new ParallaxJungle(this);
    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 180, 'STATS', TS.title()).setOrigin(0.5).setDepth(100);

    const d = Save.get();
    const s = d.stats;
    const rows: [string, string][] = [
      ['Best score',       String(d.bestScore)],
      ['Total stars',      `${Save.totalStarsAcross()} / 450`],
      ['Play streak',      `${d.playStreak.current} (best ${d.playStreak.longest})`],
      ['Challenge streak', `${d.challengeStreak}`],
      ['Levels cleared',   String(s.levelsCleared)],
      ['Bosses defeated',  String(s.bossesDefeated)],
      ['Best combo',       String(s.bestCombo)],
      ['Raccoons whacked', String(s.hits.raccoon)],
      ['Golden mole hits', String(s.hits.golden)],
      ['Frozen mole hits', String(s.hits.frozen)],
      ['Bombs tapped',     String(s.hits.bomb)],
      ['Cats tapped',      String(s.hits.cat)],
      ['Goats tapped',     String(s.hits.goat)],
      ['Escapes',          String(s.escapes)],
    ];

    const topClip = 300;
    const bottomClip = 300;
    const clipH = GAME_HEIGHT - topClip - bottomClip;
    const container = this.add.container(0, topClip);

    const kStyle = { fontFamily: '"Arial Black", Impact, sans-serif',
      fontSize: '22px', color: '#fff8e1' };
    const vStyle = { fontFamily: '"Arial Black", Impact, sans-serif',
      fontSize: '26px', color: '#ffd54f', stroke: '#000000', strokeThickness: 3 };

    let y = 20;
    for (const [k, v] of rows) {
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 80, 46, 0x2b1810, 0.7)
        .setStrokeStyle(2, 0x5d3a1a);
      const kt = this.add.text(80, y, k, kStyle).setOrigin(0, 0.5);
      const vt = this.add.text(GAME_WIDTH - 80, y, v, vStyle).setOrigin(1, 0.5);
      container.add([bg, kt, vt]);
      y += 52;
    }

    const contentH = y;
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

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('JungleBoard'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
