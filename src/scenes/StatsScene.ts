import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { ALL_MEDALS, medalById } from '../services/MedalService';

export class StatsScene extends Phaser.Scene {
  constructor() { super('Stats'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'STATS', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

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
      ['Total stars',      `${Save.totalStarsAcross()} / ${150 * 3}`],
      ['Play streak',      `${d.playStreak.current} (best ${d.playStreak.longest})`],
      ['Challenge streak', `${d.challengeStreak}`],
      ['Best score',       String(d.bestScore)],
    ];

    let y = 300;
    for (const [k, v] of rows) {
      this.add.text(80, y, k, { ...TS.body('#fff5c9'), fontSize: '26px' }).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH - 80, y, v, { ...TS.h2('#ffd54f'), fontSize: '28px' }).setOrigin(1, 0.5);
      y += 44;
    }

    y += 24;
    this.add.text(GAME_WIDTH / 2, y, 'JUNGLE BOARD', TS.title('#fff5c9')).setOrigin(0.5);
    y += 60;

    const owned = new Set(d.medals);
    const cols = 4;
    const size = 110;
    const gap = 24;
    const startX = (GAME_WIDTH - (cols * size + (cols - 1) * gap)) / 2 + size / 2;
    ALL_MEDALS.forEach((m, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = startX + c * (size + gap);
      const yy = y + r * (size + gap);
      const has = owned.has(m.id);
      const disc = this.add.circle(x, yy, size / 2, has ? 0x8d6e63 : 0x2b1810, 0.9)
        .setStrokeStyle(4, has ? 0xffd54f : 0x5d3a1a);
      const icon = this.add.image(x, yy - 6, TX.iconMedal).setOrigin(0.5).setScale(0.7);
      if (!has) icon.setAlpha(0.35);
      const label = this.add.text(x, yy + size / 2 + 4, m.title,
        { ...TS.body(has ? '#ffd54f' : '#9e9e9e'), fontSize: '18px', align: 'center', wordWrap: { width: size + gap } })
        .setOrigin(0.5, 0);
      disc.setInteractive({ useHandCursor: true });
      disc.on('pointerdown', () => {
        this.add.text(x, yy - size, m.how, { ...TS.body('#fff5c9'), fontSize: '18px', backgroundColor: '#2b1810' })
          .setOrigin(0.5).setDepth(999);
      });
      void icon; void label;
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }
}
