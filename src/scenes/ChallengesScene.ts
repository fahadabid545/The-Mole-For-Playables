import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { getChallenge, Challenge, ChallengeKind } from '../services/ChallengeService';
import { I18n } from '../services/I18nService';
import { AdBanner } from '../ui/AdBanner';
import { TS } from '../config/TextStyles';

// Landing page for BOTH daily + weekly challenges shown side by side
// (vertically stacked cards). Selecting a card starts Game with that
// challenge; the "come back later" state locks the play button and
// shows a friendly message.
export class ChallengesScene extends Phaser.Scene {
  constructor() { super('Challenges'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.text(GAME_WIDTH / 2, 150, I18n.t('challenges'), TS.title('#fff8e1'))
      .setOrigin(0.5).setDepth(50);

    const daily = getChallenge('daily');
    const weekly = getChallenge('weekly');

    this.buildCard(GAME_WIDTH / 2, 400, daily, 'daily');
    this.buildCard(GAME_WIDTH / 2, 800, weekly, 'weekly');

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
  }

  private buildCard(cx: number, cy: number, ch: Challenge, kind: ChallengeKind): void {
    const w = 620, h = 340;
    // Card shell
    const shadow = this.add.rectangle(cx + 4, cy + 8, w, h, 0x000000, 0.35).setOrigin(0.5);
    const bg = this.add.rectangle(cx, cy, w, h, 0xfff8e1, 1).setOrigin(0.5).setStrokeStyle(6, COLORS.woodDark);
    const rimTop = this.add.rectangle(cx, cy - h / 2 + 40, w - 40, 60, kind === 'daily' ? 0xffb300 : 0xef5350, 1)
      .setOrigin(0.5);
    const rimTitle = this.add.text(cx, cy - h / 2 + 40,
      kind === 'daily' ? I18n.t('todaysChallenge') : I18n.t('thisWeeksChallenge'),
      { ...TS.h2('#3e2723'), fontSize: '32px' }).setOrigin(0.5);

    // Level + info
    this.add.text(cx, cy - 40, I18n.t('level', { n: ch.params.level }),
      { ...TS.title('#1b5e20'), fontSize: '46px' }).setOrigin(0.5);
    this.add.text(cx, cy + 12,
      `Hit ${ch.params.quota}  •  ${Math.round(ch.params.timeLimitMs / 1000)}s`,
      TS.body('#5d4037')).setOrigin(0.5);

    // Reward chip
    const rewardStr = ch.rewardLives > 0 && ch.rewardBonus > 0
      ? `+${ch.rewardLives} ❤   +${ch.rewardBonus} pts`
      : ch.rewardLives > 0 ? `+${ch.rewardLives} ❤` : `+${ch.rewardBonus} pts`;
    this.add.text(cx, cy + 60, `${I18n.t('reward')}: ${rewardStr}`, TS.reward()).setOrigin(0.5);

    if (kind === 'daily' && Save.get().dailyStreak > 0) {
      this.add.text(cx + w / 2 - 60, cy - h / 2 + 40, `🔥${Save.get().dailyStreak}`,
        { ...TS.h2('#ff6f00'), fontSize: '28px' }).setOrigin(0.5);
    }

    // CTA
    if (ch.alreadyDone) {
      this.add.text(cx, cy + 115,
        kind === 'daily' ? I18n.t('alreadyDone') : I18n.t('alreadyDoneWeek'),
        { ...TS.h2('#2e7d32'), fontSize: '28px' }).setOrigin(0.5);
    } else {
      new Button(this, cx, cy + 120, {
        label: I18n.t('play'),
        onClick: () => {
          Audio.play('click');
          this.scene.stop();
          this.scene.start('Game', { level: ch.params.level, challenge: ch });
        },
        scale: 0.75,
        variant: kind === 'daily' ? 'primary' : 'ad',
      });
    }
    void shadow; void bg; void rimTop; void rimTitle;
  }
}
