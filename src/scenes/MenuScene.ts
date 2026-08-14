import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
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

    // Fit mascot to a fixed display width regardless of source PNG size,
    // and drop it below the title so JUNGLE / MOLE stays fully visible.
    const mascot = this.add.image(GAME_WIDTH / 2, 500, TX.raccoon).setOrigin(0.5);
    const mSrc = mascot.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const mSw = (mSrc as any).naturalWidth || (mSrc as any).width || 200;
    const mSh = (mSrc as any).naturalHeight || (mSrc as any).height || 200;
    const mW = 200;
    mascot.setDisplaySize(mW, (mSh * mW) / mSw);
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
    const primary = hasProgress ? I18n.t('continue') : 'PLAY';

    // 4 wooden buttons; tighter spacing to keep the 4th above the ad banner.
    const gap = 108;
    const secY = 750;
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
      label: 'HOW TO PLAY',
      onClick: () => this.scene.start('HowToPlay'),
    });

    // Top-right corner icons: sound + gear (settings).
    const topPad = 110;
    const sound = this.add.image(GAME_WIDTH - 70, topPad, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });
    const gear = this.add.image(GAME_WIDTH - 160, topPad, TX.iconGear)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    gear.on('pointerdown', () => this.scene.start('Settings'));
    this.tweens.add({ targets: gear, angle: 360, duration: 12000, repeat: -1 });

    new AdBanner(this).show();
    void save;

    if (!Save.get().welcomed) Save.setWelcomed();
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
