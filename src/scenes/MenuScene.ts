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
import { WelcomePopup } from '../ui/popups/WelcomePopup';
import { NamePromptPopup } from '../ui/popups/NamePromptPopup';
import { IS_PLAYABLES } from '../config/BuildFlags';
import { TS } from '../config/TextStyles';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    I18n.init(Save.get().lang);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const title = this.add.text(GAME_WIDTH / 2, 220, 'JUNGLE\nMOLE', TS.hero()).setOrigin(0.5);
    this.tweens.add({ targets: title, y: '+=12', yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.InOut' });

    const mascot = this.add.image(GAME_WIDTH / 2, 560, TX.raccoon).setOrigin(0.5).setScale(1.4);
    this.tweens.add({ targets: mascot, angle: -6, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });

    const highest = Save.get().highestUnlockedLevel;
    const playLabel = highest > 1 ? I18n.t('continue') : I18n.t('play');

    // Main CTA (full-size)
    new Button(this, GAME_WIDTH / 2, 740, {
      label: playLabel,
      onClick: () => this.scene.start('Game', { level: highest }),
    });

    // Secondary options — all identical size, 76px vertical spacing
    const secY = 840;
    new Button(this, GAME_WIDTH / 2, secY,       { label: I18n.t('levels'),      onClick: () => this.scene.start('LevelSelect'),  scale: 0.72 });
    new Button(this, GAME_WIDTH / 2, secY + 76,  { label: I18n.t('challenges'),  onClick: () => this.scene.start('Challenges'),   scale: 0.72, variant: 'ad' });
    new Button(this, GAME_WIDTH / 2, secY + 152, { label: I18n.t('leaderboard'), onClick: () => this.scene.start('Leaderboard'),  scale: 0.72 });
    new Button(this, GAME_WIDTH / 2, secY + 228, { label: 'Achievements',        onClick: () => this.scene.start('Achievements'), scale: 0.72 });

    // Top-right sound toggle + gear icon opens Settings
    const sound = this.add.image(GAME_WIDTH - 70, 70, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });
    const gear = this.add.image(GAME_WIDTH - 160, 70, TX.iconGear)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    gear.on('pointerdown', () => this.scene.start('Settings'));
    this.tweens.add({ targets: gear, angle: 360, duration: 12000, repeat: -1 });

    // Language chip only in store build (playables ships single-language).
    if (!IS_PLAYABLES) {
      const langBtn = this.add.text(70, 70, (Save.get().lang ?? 'en').toUpperCase(), {
        fontFamily: 'Impact, sans-serif', fontSize: '32px', color: '#fffde7', stroke: '#1b5e20', strokeThickness: 4,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      langBtn.on('pointerdown', () => new WelcomePopup(this, { onDone: () => this.scene.restart(), closeable: true }));
    }

    new AdBanner(this).show();

    // First-run onboarding
    if (!Save.get().welcomed) {
      if (IS_PLAYABLES) {
        // No language picker in playables — jump straight to name.
        new NamePromptPopup(this, '', (n) => { Save.setPlayerName(n); Save.setWelcomed(); });
      } else {
        new WelcomePopup(this, () => this.scene.restart());
      }
    }
  }
}
