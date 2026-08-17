import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { NamePromptPopup } from '../ui/popups/NamePromptPopup';
import { MagicBoxPopup } from '../ui/popups/MagicBoxPopup';
import { TS } from '../config/TextStyles';
import { IS_PORTAL, FLAGS } from '../config/BuildFlags';
import { fadeIn, fadeTo } from '../utils/SceneTransition';
import { RateUsPopup, shouldPromptRateUs } from '../ui/popups/RateUsPopup';
import { getChallenge } from '../services/ChallengeService';
import { getUnclaimedCount } from '../services/QuestService';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    fadeIn(this);
    I18n.init(Save.get().lang);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    // Title: chunky bevelled logo dropping in with rope-swing feel
    const title = this.add.text(GAME_WIDTH / 2, 260, 'JUNGLE\nMOLE', TS.hero()).setOrigin(0.5);
    title.setY(-100).setAngle(-8);
    this.tweens.add({ targets: title, y: 260, angle: 0, duration: 700, ease: 'Bounce.Out' });
    this.tweens.add({ targets: title, y: '+=14', yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.InOut', delay: 800 });
    this.tweens.add({ targets: title, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 2400, ease: 'Sine.InOut', delay: 800 });

    const mascot = this.add.image(GAME_WIDTH / 2, 560, TX.raccoon).setOrigin(0.5).setScale(1.4);
    this.tweens.add({ targets: mascot, angle: -6, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });

    const stats = Save.get();
    const allStars = Save.getAllStars();
    const statsY = 420;
    const starIcon = this.add.image(GAME_WIDTH / 2 - 180, statsY, TX.star).setOrigin(0.5).setScale(0.45);
    this.add.text(starIcon.x + 22, statsY, `${allStars}`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px', color: '#ffd54f' }).setOrigin(0, 0.5);
    this.add.text(GAME_WIDTH / 2 - 30, statsY, `Best: ${stats.bestScore}`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px', color: '#bcaaa4' }).setOrigin(0, 0.5);
    if (stats.playStreak > 0) {
      const streakIcon = this.add.image(GAME_WIDTH / 2 + 180, statsY, TX.iconFlame).setOrigin(0.5).setScale(0.5);
      this.add.text(streakIcon.x + 20, statsY, `${stats.playStreak}`,
        { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px', color: '#ff8f00' }).setOrigin(0, 0.5);
    }

    new Button(this, GAME_WIDTH / 2, 750, {
      label: I18n.t('play'),
      onClick: () => fadeTo(this, 'CategorySelect'),
    });

    const gap = 110;
    const secY = 870;
    new Button(this, GAME_WIDTH / 2, secY,           { label: I18n.t('challenges'), onClick: () => fadeTo(this, 'Challenges'), variant: 'ad' });
    new Button(this, GAME_WIDTH / 2, secY + gap,     { label: 'Quests',            onClick: () => fadeTo(this, 'QuestBoard') });
    new Button(this, GAME_WIDTH / 2, secY + gap * 2, { label: 'Achievements',       onClick: () => fadeTo(this, 'Achievements') });
    new Button(this, GAME_WIDTH / 2, secY + gap * 3, { label: 'Stats',             onClick: () => fadeTo(this, 'Stats') });
    new Button(this, GAME_WIDTH / 2, secY + gap * 4, { label: I18n.t('shop'),      onClick: () => fadeTo(this, 'Shop') });

    const unclaimed = getUnclaimedCount();
    if (unclaimed > 0) {
      const badgeX = GAME_WIDTH / 2 + 120;
      const badgeY = secY + gap - 20;
      this.add.circle(badgeX, badgeY, 18, 0xf44336, 1).setDepth(5000);
      this.add.text(badgeX, badgeY, `${unclaimed}`,
        { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px', color: '#ffffff' })
        .setOrigin(0.5).setDepth(5001);
    }

    const topPad = 110;

    const coinIcon = this.add.image(30, topPad, TX.coin).setOrigin(0, 0.5).setScale(0.9);
    this.add.text(coinIcon.x + 36, topPad, `${Save.get().coins}`, TS.hudSmall()).setOrigin(0, 0.5);

    const chest = this.add.image(coinIcon.x + 140, topPad, TX.iconChest)
      .setOrigin(0.5).setScale(1.1).setInteractive({ useHandCursor: true });
    if (Save.canOpenMagicBox()) {
      this.tweens.add({ targets: chest, angle: { from: -10, to: 10 }, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.InOut' });
      this.tweens.add({ targets: chest, scale: { from: 1.1, to: 1.25 }, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut' });
    } else {
      chest.setTint(0x888888);
    }
    chest.on('pointerdown', () => {
      if (Save.canOpenMagicBox()) {
        Audio.play('click');
        new MagicBoxPopup(this, () => {
          chest.clearTint();
          chest.setTint(0x888888);
          this.tweens.killTweensOf(chest);
          chest.setAngle(0).setScale(1.1);
        });
      } else {
        Audio.play('miss');
        const hoursLeft = Math.ceil((((Save.get().lastMagicBoxOpen ?? 0) + 24 * 60 * 60 * 1000) - Date.now()) / (60 * 60 * 1000));
        const waitText = this.add.text(chest.x, chest.y + 40, I18n.t('magicBoxWait', { n: Math.max(1, hoursLeft) }),
          { fontFamily: 'Luckiest Guy, Impact, sans-serif', fontSize: '16px', color: '#ffcc80' }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: waitText, alpha: 1, y: waitText.y - 10, duration: 300, ease: 'Sine.Out' });
        this.tweens.add({ targets: waitText, alpha: 0, delay: 1500, duration: 400, onComplete: () => waitText.destroy() });
      }
    });

    const sound = this.add.image(GAME_WIDTH - 70, topPad, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });
    const gear = this.add.image(GAME_WIDTH - 160, topPad, TX.iconGear)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    gear.on('pointerdown', () => { Audio.play('click'); fadeTo(this, 'Settings'); });
    this.tweens.add({ targets: gear, angle: 360, duration: 12000, repeat: -1 });

    const helpBg = this.add.circle(GAME_WIDTH - 250, topPad, 26, 0x263238, 0.85)
      .setStrokeStyle(3, 0xffb300).setInteractive({ useHandCursor: true });
    const helpText = this.add.text(GAME_WIDTH - 250, topPad, '?',
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '32px', color: '#ffb300' }).setOrigin(0.5);
    helpBg.on('pointerdown', () => { Audio.play('click'); fadeTo(this, 'HowToPlay'); });
    helpBg.on('pointerover', () => this.tweens.add({ targets: helpText, scale: 1.2, duration: 100 }));
    helpBg.on('pointerout', () => this.tweens.add({ targets: helpText, scale: 1, duration: 100 }));

    new AdBanner(this).show();

    if (!Save.get().welcomed) {
      if (IS_PORTAL) {
        Save.setWelcomed();
      } else {
        new NamePromptPopup(this, '', (n) => { Save.setPlayerName(n); Save.setWelcomed(); });
      }
    }

    const streakCoins = Save.claimStreakReward();
    if (streakCoins > 0) {
      Audio.play('extraLife');
      const streakBanner = this.add.text(GAME_WIDTH / 2, 480,
        `Streak Bonus: +${streakCoins} coins!`,
        { ...TS.title('#ff8f00'), fontSize: '30px' }).setOrigin(0.5).setAlpha(0).setDepth(5000);
      this.tweens.add({ targets: streakBanner, alpha: 1, y: 460, duration: 400, ease: 'Back.Out' });
      this.tweens.add({ targets: streakBanner, alpha: 0, y: 440, delay: 2500, duration: 500,
        onComplete: () => streakBanner.destroy() });
    }

    if (shouldPromptRateUs()) {
      Save.incrementRatePrompt();
      this.time.delayedCall(1200, () => {
        new RateUsPopup(this, () => { /* stay on menu */ });
      });
    }

    this.showReturnNudge();
  }

  private showReturnNudge(): void {
    const nudge = this.pickNudge();
    if (!nudge) return;

    const bg = this.add.rectangle(GAME_WIDTH / 2, 660, 560, 46, 0x1b5e20, 0.85)
      .setOrigin(0.5).setStrokeStyle(2, 0xa5d6a7).setAlpha(0).setDepth(4000);
    const txt = this.add.text(GAME_WIDTH / 2, 660, nudge,
      { fontFamily: 'sans-serif', fontSize: '20px', color: '#c8e6c9', align: 'center' })
      .setOrigin(0.5).setAlpha(0).setDepth(4001);

    this.tweens.add({ targets: [bg, txt], alpha: 1, y: '-=10', duration: 500, delay: 600, ease: 'Sine.Out' });
    this.tweens.add({ targets: [bg, txt], alpha: 0, delay: 6000, duration: 600 });
  }

  private pickNudge(): string | null {
    const d = Save.get();
    const daily = getChallenge('daily');
    const weekly = getChallenge('weekly');

    const uncl = getUnclaimedCount();
    if (uncl > 0)
      return `${uncl} quest reward${uncl > 1 ? 's' : ''} ready to claim!`;
    if (!daily.alreadyDone)
      return 'Daily Challenge available -- earn a free life!';
    if (!weekly.alreadyDone)
      return 'Weekly Challenge ready -- earn 3 free lives!';
    if (Save.canOpenMagicBox())
      return 'Your Magic Box is ready to open!';
    if (d.playStreak >= 3)
      return `${d.playStreak}-day streak! Keep playing to earn more coins.`;
    const easyLvl = Save.getCategoryProgress('easy').highestUnlockedLevel;
    if (easyLvl > 1 && easyLvl < 50)
      return `Easy Level ${easyLvl} awaits -- keep going!`;
    return null;
  }

}
