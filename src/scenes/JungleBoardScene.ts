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
    this.add.text(GAME_WIDTH / 2, 180, 'JUNGLE\nBOARD', TS.title()).setOrigin(0.5).setDepth(100);

    const d = Save.get();
    const totalStars = Save.totalStarsAcross();
    const medalsOwned = d.medals.filter(id => ALL_MEDALS.some(m => m.id === id)).length;
    const achievements = (d.achievements ?? []).length;

    const tiles: Tile[] = [
      { title: 'STATS',        subtitle: `Best ${d.bestScore}`,         scene: 'Stats',        color: 0xffd54f },
      { title: 'MEDALS',       subtitle: `${medalsOwned} / ${ALL_MEDALS.length}`, scene: 'Medals', color: 0xffb300 },
      { title: 'ACHIEVEMENTS', subtitle: `${achievements} unlocked`,    scene: 'Achievements', color: 0x66bb6a },
      { title: 'HOW TO PLAY',  subtitle: `${totalStars} stars total`,   scene: 'HowToPlay',    color: 0x81d4fa },
    ];

    const tileW = (GAME_WIDTH - 90) / 2;
    const tileH = 230;
    const gap = 30;
    const startX = 45 + tileW / 2;
    const startY = 420;
    tiles.forEach((t, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = startX + col * (tileW + gap);
      const y = startY + row * (tileH + gap);
      this.buildTile(x, y, tileW, tileH, t);
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });
    new AdBanner(this).show();
  }

  private buildTile(x: number, y: number, w: number, h: number, t: Tile): void {
    const bg = this.add.rectangle(x, y, w, h, 0x2b1810, 0.9)
      .setStrokeStyle(5, t.color).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 50, t.title,
      { ...TS.panelTitle('#fff5c9'), fontSize: '30px', align: 'center',
        wordWrap: { width: w - 24 } }).setOrigin(0.5);
    this.add.text(x, y + 30, t.subtitle,
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '22px',
        color: '#ffd54f', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);

    bg.on('pointerover', () => this.tweens.add({ targets: bg, scale: 1.04, duration: 120 }));
    bg.on('pointerout',  () => this.tweens.add({ targets: bg, scale: 1, duration: 120 }));
    bg.on('pointerdown', () => {
      Audio.play('click');
      this.scene.start(t.scene);
    });
  }
}
