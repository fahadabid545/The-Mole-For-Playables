import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Leaderboard, LeaderboardEntry } from '../services/LeaderboardService';
import { Button } from '../ui/Button';
import { I18n } from '../services/I18nService';
import { Save } from '../services/SaveService';
import { AdBanner } from '../ui/AdBanner';

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.text(GAME_WIDTH / 2, 100, I18n.t('world'), {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '52px', color: '#fff8e1', stroke: '#1b5e20', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 170, I18n.t('yourBest', { n: Save.get().bestScore }), {
      fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#fffde7', stroke: '#3e2723', strokeThickness: 4,
    }).setOrigin(0.5);

    void Leaderboard.top(20).then((entries: LeaderboardEntry[]) => this.render(entries));

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
  }

  private render(entries: LeaderboardEntry[]): void {
    const startY = 240;
    const rowH = 56;
    entries.forEach((e, i) => {
      const y = startY + i * rowH;
      const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 60, rowH - 6,
        i % 2 === 0 ? 0xfff8e1 : 0xe8f5e9, 0.85).setStrokeStyle(2, COLORS.woodDark);
      void bg;
      const style = { fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#3e2723' };
      this.add.text(60, y, `${i + 1}`, style).setOrigin(0, 0.5);
      this.add.text(140, y, e.name, style).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH - 220, y, `L${e.level}`, style).setOrigin(0, 0.5);
      this.add.text(GAME_WIDTH - 60, y, `${e.score}`, { ...style, color: '#2e7d32' }).setOrigin(1, 0.5);
    });
  }
}
