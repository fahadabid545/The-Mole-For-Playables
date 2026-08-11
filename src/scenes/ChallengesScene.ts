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
import { TX } from '../objects/TextureFactory';

export class ChallengesScene extends Phaser.Scene {
  constructor() { super('Challenges'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(49).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 175, I18n.t('challenges').toUpperCase(), TS.title())
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
    this.add.rectangle(cx + 4, cy + 8, w, h, 0x000000, 0.35).setOrigin(0.5);
    this.add.rectangle(cx, cy, w, h, 0xfff8e1, 1).setOrigin(0.5).setStrokeStyle(6, COLORS.woodDark);
    this.add.rectangle(cx, cy - h / 2 + 40, w - 40, 60, kind === 'daily' ? 0xffb300 : 0xef5350, 1)
      .setOrigin(0.5);
    this.add.text(cx, cy - h / 2 + 40,
      kind === 'daily' ? I18n.t('todaysChallenge') : I18n.t('thisWeeksChallenge'),
      { ...TS.h2('#3e2723'), fontSize: '32px' }).setOrigin(0.5);

    this.add.text(cx, cy - 40, I18n.t('level', { n: ch.params.level }),
      { ...TS.title('#1b5e20'), fontSize: '46px' }).setOrigin(0.5);
    this.add.text(cx, cy + 12,
      `Hit ${ch.params.quota}  •  ${Math.round(ch.params.timeLimitMs / 1000)}s`,
      TS.body('#5d4037')).setOrigin(0.5);

    const rewardText = `${I18n.t('reward')}:`;
    const label = this.add.text(cx - 220, cy + 60, rewardText, TS.reward()).setOrigin(0, 0.5);
    let xOff = label.x + label.width + 16;
    if (ch.rewardLives > 0) {
      const h1 = this.add.image(xOff, cy + 60, TX.iconHeartIcon).setOrigin(0, 0.5).setScale(0.8);
      this.add.text(h1.x + h1.displayWidth + 6, cy + 60, `+${ch.rewardLives}`, TS.reward()).setOrigin(0, 0.5);
    }

    if (kind === 'daily' && Save.get().challengeStreak > 0) {
      this.add.image(cx + w / 2 - 90, cy - h / 2 + 40, TX.iconFlame).setOrigin(0.5).setScale(0.9);
      this.add.text(cx + w / 2 - 50, cy - h / 2 + 40, `${Save.get().challengeStreak}`,
        { ...TS.h2('#ff6f00'), fontSize: '28px' }).setOrigin(0, 0.5);
    }

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
  }
}
