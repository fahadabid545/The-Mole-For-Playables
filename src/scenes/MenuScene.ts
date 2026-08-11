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
import type { CategoryId } from '../config/Theme';
import { OutOfLivesPopup } from '../ui/popups/OutOfLivesPopup';
import { allChallengesDone } from '../services/ChallengeService';
import { TS } from '../config/TextStyles';
import { checkMedals } from '../services/MedalService';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    I18n.init(Save.get().lang);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const title = this.add.text(GAME_WIDTH / 2, 240, 'JUNGLE\nMOLE', TS.hero()).setOrigin(0.5);
    title.setY(-100).setAngle(-8);
    this.tweens.add({ targets: title, y: 240, angle: 0, duration: 700, ease: 'Bounce.Out' });
    this.tweens.add({ targets: title, y: '+=14', yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.InOut', delay: 800 });
    this.tweens.add({ targets: title, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 2400, ease: 'Sine.InOut', delay: 800 });

    const mascot = this.add.image(GAME_WIDTH / 2, 560, TX.raccoon).setOrigin(0.5).setScale(1.4);
    this.tweens.add({ targets: mascot, angle: -6, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });

    Save.tickDailyPlayStreak();
    const cs = Save.get().challengeStreak;
    if (cs > 0 && cs % 3 === 0 && !Save.get().medals.includes(`csr-${cs}`)) {
      Save.addLife(1);
      Save.awardMedal(`csr-${cs}`);
      EventBus.emit(EVT.LIFE_CHANGED);
    }
    checkMedals();
    const save = Save.get();
    const lastCat = save.lastPlayedCategory ?? 'easy';
    const lastLevel = save.lastPlayedLevel ?? 1;
    const highestInLast = save.categories[lastCat].highestUnlockedLevel;
    const resumeLevel = Math.max(1, Math.min(lastLevel, highestInLast));
    const hasProgress = highestInLast > 1 || lastLevel > 1;

    // Three floating info plaques around the mascot — no dark pill.
    this.floatChip(GAME_WIDTH / 2 - 260, 460, TX.iconTrophy, `${save.bestScore}`,   'BEST',   -6);
    this.floatChip(GAME_WIDTH / 2,       420, TX.star,         `${Save.totalStarsAcross()}`, 'STARS', 0);
    this.floatChip(GAME_WIDTH / 2 + 260, 460, TX.iconFlame,   `${save.playStreak.current}`,  'STREAK', 6);

    // 4 wooden buttons only.
    const gap = 132;
    const secY = 780;
    const primary = hasProgress ? I18n.t('continue') : 'PLAY';
    new Button(this, GAME_WIDTH / 2, secY, {
      label: primary,
      onClick: () => hasProgress
        ? this.tryStartLevel(resumeLevel, lastCat)
        : this.scene.start('CategorySelect'),
    });
    new Button(this, GAME_WIDTH / 2, secY + gap, {
      label: I18n.t('challenges'), variant: 'ad',
      onClick: () => this.scene.start('Challenges'),
    });
    new Button(this, GAME_WIDTH / 2, secY + gap * 2, {
      label: 'JUNGLE BOARD',
      onClick: () => this.scene.start('JungleBoard'),
    });
    new Button(this, GAME_WIDTH / 2, secY + gap * 3, {
      label: 'SETTINGS',
      onClick: () => this.scene.start('Settings'),
    });

    const topPad = 110;
    const sound = this.add.image(GAME_WIDTH - 70, topPad, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });

    new AdBanner(this).show();

    if (!Save.get().welcomed) Save.setWelcomed();
  }

  // Small icon + number + label chip that gently drifts. No box, no
  // stroke-pill — just legible text over the parallax.
  private floatChip(x: number, y: number, iconKey: string, value: string, label: string, angle: number): void {
    const icon = this.add.image(x, y - 4, iconKey).setOrigin(0.5).setScale(0.55);
    const num = this.add.text(x, y + 30, value,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '32px', color: '#ffd54f',
        stroke: '#3e2723', strokeThickness: 5 }).setOrigin(0.5).setAngle(angle);
    const lbl = this.add.text(x, y + 60, label,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '18px', color: '#fff5c9',
        stroke: '#3e2723', strokeThickness: 3 }).setOrigin(0.5).setAngle(angle);
    this.tweens.add({ targets: [icon, num, lbl], y: '+=6', yoyo: true, repeat: -1,
      duration: 1400 + Math.random() * 600, ease: 'Sine.InOut' });
  }

  private tryStartLevel(level: number, category: CategoryId = 'easy'): void {
    Save.tryRegenLives(allChallengesDone());
    if (Save.get().lives > 0) {
      this.scene.start('Game', { level, category });
      return;
    }
    new OutOfLivesPopup(this, {
      onWatchAdForLife: async () => {
        const r = await Ads.showRewarded();
        if (r === 'reward') {
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
          this.scene.start('Game', { level, category });
        }
      },
      onChallenges: () => this.scene.start('Challenges'),
      onLivesRefilled: () => this.scene.start('Game', { level, category }),
      onMenu: () => {},
    });
  }
}
