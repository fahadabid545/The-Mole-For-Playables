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

  private timeToDailyReset(): string {
    // Next UTC midnight — matches todayKey() in ChallengeService.
    const now = new Date();
    const next = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    return this.fmtDuration(next.getTime() - now.getTime());
  }
  private timeToWeeklyReset(): string {
    // Next Monday UTC 00:00 — approximate weekly reset.
    const now = new Date();
    const day = now.getUTCDay() || 7; // 1..7 (Mon..Sun)
    const daysUntilMon = ((8 - day) % 7) || 7;
    const next = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMon, 0, 0, 0));
    return this.fmtDuration(next.getTime() - now.getTime());
  }
  private fmtDuration(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(49).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 175, I18n.t('challenges').toUpperCase(), TS.title())
      .setOrigin(0.5).setDepth(50);

    const daily = getChallenge('daily');
    const weekly = getChallenge('weekly');

    // More air between the two boards so they read as separate quests.
    this.buildCard(GAME_WIDTH / 2, 400, daily, 'daily');
    this.buildCard(GAME_WIDTH / 2, 900, weekly, 'weekly');

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
  }

  private buildCard(cx: number, cy: number, ch: Challenge, kind: ChallengeKind): void {
    const w = 540, h = 380;
    // Wooden plank card — replaces the flat rectangle.
    const tile = this.add.image(cx, cy, TX.tileWood).setOrigin(0.5)
      .setDisplaySize(w, h).setTint(0xfff8e1);
    void tile;
    // Header ribbon
    this.add.rectangle(cx, cy - h / 2 + 42, w - 40, 56, kind === 'daily' ? 0xffb300 : 0xef5350, 1)
      .setOrigin(0.5).setStrokeStyle(4, COLORS.woodDark);
    this.add.text(cx, cy - h / 2 + 42,
      kind === 'daily' ? I18n.t('todaysChallenge') : I18n.t('thisWeeksChallenge'),
      { ...TS.h2('#3e2723'), fontSize: '30px' }).setOrigin(0.5);

    // Show ONLY the type + a countdown to reset. Level number and
    // hits-in-Ns line removed per user request — the type + reward is
    // enough for the player to decide whether to play.
    this.add.text(cx, cy - 30,
      kind === 'daily' ? 'DAILY CHALLENGE' : 'WEEKLY CHALLENGE',
      { ...TS.title('#1b5e20'), fontSize: '38px', strokeThickness: 5 }).setOrigin(0.5);
    const resets = kind === 'daily' ? this.timeToDailyReset() : this.timeToWeeklyReset();
    this.add.text(cx, cy + 10, `Resets in ${resets}`,
      { ...TS.body('#5d4037'), fontSize: '22px' }).setOrigin(0.5);

    // Reward row — center-aligned as a whole group.
    if (ch.rewardLives > 0) {
      const label = this.add.text(0, 0, `${I18n.t('reward')}:`, TS.reward()).setOrigin(0, 0.5);
      const heart = this.add.image(0, 0, TX.iconHeartIcon).setOrigin(0, 0.5).setScale(0.8);
      const amount = this.add.text(0, 0, `+${ch.rewardLives}`, TS.reward()).setOrigin(0, 0.5);
      const spacing = 10;
      const totalW = label.width + spacing + heart.displayWidth + spacing + amount.width;
      const startX = cx - totalW / 2;
      label.setPosition(startX, cy + 40);
      heart.setPosition(startX + label.width + spacing, cy + 40);
      amount.setPosition(heart.x + heart.displayWidth + spacing, cy + 40);
    }

    if (kind === 'daily' && Save.get().challengeStreak > 0) {
      this.add.image(cx + w / 2 - 60, cy - h / 2 + 42, TX.iconFlame).setOrigin(0.5).setScale(0.85);
      this.add.text(cx + w / 2 - 30, cy - h / 2 + 42, `${Save.get().challengeStreak}`,
        { ...TS.h2('#ff6f00'), fontSize: '28px' }).setOrigin(0, 0.5);
    }

    if (ch.alreadyDone) {
      this.add.text(cx, cy + h / 2 - 60,
        kind === 'daily' ? I18n.t('alreadyDone') : I18n.t('alreadyDoneWeek'),
        { ...TS.h2('#2e7d32'), fontSize: '28px' }).setOrigin(0.5);
    } else {
      new Button(this, cx, cy + h / 2 - 50, {
        label: I18n.t('play'),
        onClick: () => {
          Audio.play('click');
          this.scene.stop();
          this.scene.start('Game', { level: ch.params.level, challenge: ch });
        },
        scale: 0.7,
        variant: kind === 'daily' ? 'primary' : 'ad',
      });
    }
  }
}
