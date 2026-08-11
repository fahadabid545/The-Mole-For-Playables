import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { Save } from '../services/SaveService';
import { ALL_MEDALS } from '../services/MedalService';
import { ACHIEVEMENTS } from '../services/AchievementService';
import { Audio } from '../services/AudioService';

interface Tile {
  title: string;
  subtitle: string;
  scene: string;
  color: number;
}

export class JungleBoardScene extends Phaser.Scene {
  constructor() { super('JungleBoard'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 175, 'JUNGLE BOARD',
      { ...TS.title(), fontSize: '44px' }).setOrigin(0.5).setDepth(100);

    const d = Save.get();
    const totalMedals = d.medals.filter(id => ALL_MEDALS.some(m => m.id === id)).length;
    const achievements = (d.achievements ?? []).length;

    const tiles: Tile[] = [
      { title: 'ACHIEVEMENTS', subtitle: `${achievements} / ${ACHIEVEMENTS.length} unlocked`, scene: 'Achievements', color: 0x66bb6a },
      { title: 'STATS',        subtitle: `${d.stats.levelsCleared} levels cleared`,            scene: 'Stats',        color: 0xffd54f },
      { title: 'MEDALS',       subtitle: `${totalMedals} / ${ALL_MEDALS.length} earned`,       scene: 'Medals',       color: 0xffb300 },
    ];

    const startY = 360;
    const gap = 220;
    tiles.forEach((t, i) => this.buildTile(GAME_WIDTH / 2, startY + i * gap, t));

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }

  private buildTile(x: number, y: number, t: Tile): void {
    const w = GAME_WIDTH - 90;
    const h = 170;
    const tile = this.add.image(x, y, TX.tileWood).setOrigin(0.5)
      .setDisplaySize(w, h).setInteractive({ useHandCursor: true });

    this.add.text(x, y - 30, t.title,
      { ...TS.title('#fff5c9'), fontSize: '40px', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(x, y + 30, t.subtitle,
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
        color: '#ffd54f', stroke: '#3e2723', strokeThickness: 3 }).setOrigin(0.5);

    // Colored highlight strip on the left edge of each tile.
    this.add.rectangle(x - w / 2 + 12, y, 8, h - 24, t.color, 0.9).setOrigin(0, 0.5);

    tile.on('pointerover', () => this.tweens.add({ targets: tile, scaleX: (w / tile.width) * 1.02,
      scaleY: (h / tile.height) * 1.02, duration: 120 }));
    tile.on('pointerout',  () => this.tweens.add({ targets: tile, scaleX: (w / tile.width),
      scaleY: (h / tile.height), duration: 120 }));
    tile.on('pointerdown', () => { Audio.play('click'); this.scene.start(t.scene); });
  }
}
