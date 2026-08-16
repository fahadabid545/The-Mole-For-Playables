import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { Ads } from '../services/AdsService';
import { EventBus, EVT } from '../utils/EventBus';
import { I18n } from '../services/I18nService';
import { NamePromptPopup } from '../ui/popups/NamePromptPopup';
import { OutOfLivesPopup } from '../ui/popups/OutOfLivesPopup';
import { MagicBoxPopup } from '../ui/popups/MagicBoxPopup';
import { allChallengesDone } from '../services/ChallengeService';
import { TS } from '../config/TextStyles';
import { IS_PORTAL } from '../config/BuildFlags';
import { fadeIn, fadeTo } from '../utils/SceneTransition';

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
    const statsY = 420;
    const starIcon = this.add.image(GAME_WIDTH / 2 - 180, statsY, TX.star).setOrigin(0.5).setScale(0.45);
    this.add.text(starIcon.x + 22, statsY, `${stats.totalStars}`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px', color: '#ffd54f' }).setOrigin(0, 0.5);
    this.add.text(GAME_WIDTH / 2 - 30, statsY, `Best: ${stats.bestScore}`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px', color: '#bcaaa4' }).setOrigin(0, 0.5);
    if (stats.playStreak > 0) {
      const streakIcon = this.add.image(GAME_WIDTH / 2 + 180, statsY, TX.iconFlame).setOrigin(0.5).setScale(0.5);
      this.add.text(streakIcon.x + 20, statsY, `${stats.playStreak}`,
        { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px', color: '#ff8f00' }).setOrigin(0, 0.5);
    }

    const highest = Save.get().highestUnlockedLevel;
    const playLabel = highest > 1 ? I18n.t('continue') : I18n.t('play');

    // Main CTA (full-size). Lifted a touch so the whole button column
    // fits comfortably above the bottom foreground foliage.
    new Button(this, GAME_WIDTH / 2, 750, {
      label: playLabel,
      onClick: () => this.tryStartLevel(highest),
    });

    // Secondary options — same full size as the main CTA. Leaderboard
    // was removed (Playables single-HTML can't reach a shared backend,
    // so a truly universal leaderboard isn't possible here). Challenges
    // takes its slot as the highlighted rewards path.
    const gap = 118;
    const secY = 870;
    new Button(this, GAME_WIDTH / 2, secY,           { label: I18n.t('levels'),     onClick: () => fadeTo(this, 'LevelSelect') });
    new Button(this, GAME_WIDTH / 2, secY + gap,     { label: I18n.t('challenges'), onClick: () => fadeTo(this, 'Challenges'), variant: 'ad' });
    new Button(this, GAME_WIDTH / 2, secY + gap * 2, { label: 'Achievements',       onClick: () => fadeTo(this, 'Achievements') });
    new Button(this, GAME_WIDTH / 2, secY + gap * 3, { label: 'Stats',             onClick: () => fadeTo(this, 'Stats') });
    new Button(this, GAME_WIDTH / 2, secY + gap * 4, { label: I18n.t('shop'),      onClick: () => fadeTo(this, 'Shop') });

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
  }

  private tryStartLevel(level: number): void {
    Save.tryRegenLives(allChallengesDone());
    if (Save.get().lives > 0) {
      this.scene.start('Game', { level });
      return;
    }
    new OutOfLivesPopup(this, {
      onWatchAdForLife: async () => {
        const r = await Ads.showRewarded();
        if (r === 'reward') {
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
          this.scene.start('Game', { level });
        }
      },
      onChallenges: () => this.scene.start('Challenges'),
      onLivesRefilled: () => this.scene.start('Game', { level }),
      onMenu: () => { /* stay on menu */ },
    });
  }
}
