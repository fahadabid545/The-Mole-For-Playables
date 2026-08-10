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
import { allChallengesDone } from '../services/ChallengeService';
import { TS } from '../config/TextStyles';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    I18n.init(Save.get().lang);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const title = this.add.text(GAME_WIDTH / 2, 260, 'JUNGLE\nMOLE', TS.hero()).setOrigin(0.5);
    title.setY(-100).setAngle(-8);
    this.tweens.add({ targets: title, y: 260, angle: 0, duration: 700, ease: 'Bounce.Out' });
    this.tweens.add({ targets: title, y: '+=14', yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.InOut', delay: 800 });
    this.tweens.add({ targets: title, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 2400, ease: 'Sine.InOut', delay: 800 });

    const mascot = this.add.image(GAME_WIDTH / 2, 560, TX.raccoon).setOrigin(0.5).setScale(1.4);
    this.tweens.add({ targets: mascot, angle: -6, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });

    Save.tickDailyPlayStreak();
    const highest = Save.get().categories.easy.highestUnlockedLevel;
    const playLabel = highest > 1 ? I18n.t('continue') : I18n.t('play');

    new Button(this, GAME_WIDTH / 2, 750, {
      label: playLabel,
      onClick: () => this.tryStartLevel(highest),
    });

    const gap = 118;
    const secY = 870;
    new Button(this, GAME_WIDTH / 2, secY,           { label: I18n.t('levels'),     onClick: () => this.scene.start('LevelSelect') });
    new Button(this, GAME_WIDTH / 2, secY + gap,     { label: I18n.t('challenges'), onClick: () => this.scene.start('Challenges'), variant: 'ad' });
    new Button(this, GAME_WIDTH / 2, secY + gap * 2, { label: 'Achievements',       onClick: () => this.scene.start('Achievements') });

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

    if (!Save.get().welcomed) {
      new NamePromptPopup(this, '', (n) => { Save.setPlayerName(n); Save.setWelcomed(); });
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
      onMenu: () => {},
    });
  }
}
