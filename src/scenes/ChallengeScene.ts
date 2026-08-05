import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { EventBus, EVT } from '../utils/EventBus';
import { Audio } from '../services/AudioService';
import { getChallenge, ChallengeKind } from '../services/ChallengeService';
import { I18n } from '../services/I18nService';
import { AdBanner } from '../ui/AdBanner';

// Landing card for a challenge: shows what today's / this week's
// challenge is, its reward, and a Start button (or a "come back
// tomorrow!" message if you already did it in this period).
export class ChallengeScene extends Phaser.Scene {
  constructor() { super('Challenge'); }

  create(data: { kind: ChallengeKind }): void {
    new ParallaxJungle(this);
    const kind = data.kind;
    const ch = getChallenge(kind);

    const title = kind === 'daily' ? I18n.t('todaysChallenge') : I18n.t('thisWeeksChallenge');

    this.add.text(GAME_WIDTH / 2, 200, title, {
      fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '58px',
      color: '#fff8e1', stroke: '#1b5e20', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 300, `L${ch.params.level} • Hit ${ch.params.quota} in ${Math.round(ch.params.timeLimitMs / 1000)}s`, {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#fffde7', stroke: '#3e2723', strokeThickness: 4,
    }).setOrigin(0.5);

    // Reward card
    const rewards: string[] = [];
    if (ch.rewardLives > 0) rewards.push(`+${ch.rewardLives} ${I18n.t('plusOneLife').replace('+1 ', '')}`);
    if (ch.rewardBonus > 0) rewards.push(I18n.t('plusBonus', { n: ch.rewardBonus }));
    this.add.text(GAME_WIDTH / 2, 380, `${I18n.t('reward')}: ${rewards.join(' + ')}`, {
      fontFamily: 'Impact, sans-serif', fontSize: '32px', color: '#ffca28', stroke: '#3e2723', strokeThickness: 4,
    }).setOrigin(0.5);

    if (kind === 'daily' && Save.get().dailyStreak > 0) {
      this.add.text(GAME_WIDTH / 2, 440, `🔥 Streak: ${Save.get().dailyStreak}`, {
        fontFamily: 'Impact, sans-serif', fontSize: '28px', color: '#ffab40',
      }).setOrigin(0.5);
    }

    if (ch.alreadyDone) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80,
        kind === 'daily' ? I18n.t('alreadyDone') : I18n.t('alreadyDoneWeek'), {
        fontFamily: 'Impact, sans-serif', fontSize: '40px', color: '#66bb6a',
      }).setOrigin(0.5);
    } else {
      new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, {
        label: I18n.t('play'),
        onClick: () => {
          Audio.play('click');
          // Reuse GameScene with challenge params via events channel
          EventBus.emit('challenge-start', ch);
          this.scene.stop('Menu');
          this.scene.start('Game', { level: ch.params.level, challenge: ch });
        },
      });
    }

    // Weekly button when on daily; and vice versa
    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 340, {
      label: kind === 'daily' ? I18n.t('weeklyChallenge') : I18n.t('dailyChallenge'),
      onClick: () => this.scene.start('Challenge', { kind: kind === 'daily' ? 'weekly' : 'daily' }),
      scale: 0.8, variant: 'ad',
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.75,
    });

    new AdBanner(this).show();
  }
}
