import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { WelcomePopup } from '../ui/popups/WelcomePopup';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    // Hydrate language + welcome flow
    I18n.init(Save.get().lang);

    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const title = this.add.text(GAME_WIDTH / 2, 260, 'JUNGLE\nMOLE', {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '128px',
      color: '#fff8e1',
      stroke: '#1b5e20',
      strokeThickness: 12,
      align: 'center',
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: '+=12', yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.InOut' });

    const mascot = this.add.image(GAME_WIDTH / 2, 640, TX.raccoon).setOrigin(0.5).setScale(1.6);
    this.tweens.add({ targets: mascot, angle: -6, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });

    const highest = Save.get().highestUnlockedLevel;
    new Button(this, GAME_WIDTH / 2, 880, {
      label: highest > 1 ? `${I18n.t('continue')}  (L${highest})` : I18n.t('play'),
      onClick: () => this.scene.start('Game', { level: highest }),
    });
    new Button(this, GAME_WIDTH / 2, 980, {
      label: I18n.t('levels'), onClick: () => this.scene.start('LevelSelect'), scale: 0.85,
    });
    new Button(this, GAME_WIDTH / 2, 1070, {
      label: I18n.t('leaderboard'), onClick: () => this.scene.start('Leaderboard'), scale: 0.85,
    });

    // Sound toggle
    const sound = this.add.image(GAME_WIDTH - 70, 70, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });

    // Language quick switch (opens welcome popup as a picker)
    const langBtn = this.add.text(70, 70, (Save.get().lang ?? 'en').toUpperCase(), {
      fontFamily: 'Impact, sans-serif', fontSize: '32px', color: '#fffde7', stroke: '#1b5e20', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    langBtn.on('pointerdown', () => new WelcomePopup(this, { onDone: () => this.scene.restart(), closeable: true }));

    new AdBanner(this).show();

    if (!Save.get().welcomed) {
      new WelcomePopup(this, () => this.scene.restart());
    }
  }
}
