import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TS } from '../config/TextStyles';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { fadeIn, fadeTo } from '../utils/SceneTransition';

export class StatsScene extends Phaser.Scene {
  constructor() { super('Stats'); }

  create(): void {
    fadeIn(this);
    new ParallaxJungle(this);
    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, 'Stats', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const stats = Save.getStats();
    const save = Save.get();

    const entries: { label: string; value: string; icon: string }[] = [
      { label: 'Raccoons Hit',  value: `${stats.raccoonsHit}`, icon: TX.raccoon },
      { label: 'Golden Hit',    value: `${stats.goldensHit}`,  icon: TX.raccoonGolden },
      { label: 'Bosses Hit',    value: `${stats.bossesHit}`,   icon: TX.raccoonBoss },
      { label: 'Frozen Hit',    value: `${stats.frozenHit}`,   icon: TX.raccoonFrozen },
      { label: 'Bombs Tapped',  value: `${stats.bombsHit}`,    icon: TX.bomb },
      { label: 'Escapes',       value: `${stats.escapes}`,     icon: TX.logHole },
      { label: 'Best Combo',    value: `${stats.bestCombo}`,   icon: TX.star },
      { label: 'Games Played',  value: `${stats.totalGamesPlayed}`, icon: TX.iconGear },
      { label: 'Best Score',    value: `${save.bestScore}`,    icon: TX.star },
      { label: 'Play Streak',   value: `${save.playStreak} day${save.playStreak !== 1 ? 's' : ''}`, icon: TX.iconChest },
      { label: 'Total Stars',   value: `${save.totalStars}`,   icon: TX.star },
    ];

    const startY = 290;
    const rowH = 76;
    entries.forEach((entry, i) => {
      const y = startY + i * rowH;
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 50, rowH - 8, 0xfff5c9, 0.95)
        .setStrokeStyle(3, COLORS.woodDark);
      this.add.image(70, y, entry.icon).setOrigin(0.5).setScale(0.55);
      this.add.text(120, y, entry.label, { ...TS.body('#3e2723'), fontSize: '24px' }).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH - 60, y, entry.value,
        { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '28px', color: '#ff8f00' }).setOrigin(1, 0.5);
    });

    const backY = startY + entries.length * rowH + 40;
    new Button(this, GAME_WIDTH / 2, backY, {
      label: 'Back',
      onClick: () => { Audio.play('click'); fadeTo(this, 'Menu'); },
    });

    new AdBanner(this).show();
  }
}
