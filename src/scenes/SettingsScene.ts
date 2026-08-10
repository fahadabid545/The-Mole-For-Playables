import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { Popup } from '../ui/popups/Popup';
import { Ads } from '../services/AdsService';
import { EventBus, EVT } from '../utils/EventBus';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 130, TX.iconGear).setOrigin(0.5).setScale(0.9);
    this.add.text(GAME_WIDTH / 2, 220, 'Settings', TS.title('#fff8e1')).setOrigin(0.5);

    let y = 340;
    this.add.text(80, y, 'Sound', TS.h2('#fff8e1')).setOrigin(0, 0.5);
    const soundIcon = this.add.image(GAME_WIDTH - 100, y, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundIcon.on('pointerdown', () => {
      const m = Audio.toggleMute();
      soundIcon.setTexture(m ? TX.soundOff : TX.soundOn);
    });

    y = 480;
    new Button(this, GAME_WIDTH / 2, y, {
      label: '+1 Life (Watch Ad)',
      onClick: async () => {
        const r = await Ads.showRewarded();
        if (r === 'reward') {
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
        }
      },
      scale: 0.9, variant: 'ad',
    });
    y = 600;
    new Button(this, GAME_WIDTH / 2, y, {
      label: 'Show Ad',
      onClick: () => { void Ads.showInterstitial(); },
      scale: 0.85, variant: 'ad',
    });

    y = GAME_HEIGHT - 490;
    new Button(this, GAME_WIDTH / 2, y, {
      label: 'Reset Progress',
      onClick: () => this.confirmReset(),
      scale: 0.9, variant: 'ad',
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 370,
      'Jungle Mole v0.2\nBuilt with Phaser 3',
      { ...TS.body('#fff8e1'), align: 'center', fontSize: '22px' }).setOrigin(0.5);

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
    void COLORS;
  }

  private confirmReset(): void {
    const popup = new Popup(this);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140,
      'Reset ALL progress?',
      { ...TS.title('#b71c1c'), fontSize: '44px' }).setOrigin(0.5);
    const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60,
      'This cannot be undone.',
      { ...TS.body('#3e2723'), align: 'center', fontSize: '28px' }).setOrigin(0.5);
    const yes = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, {
      label: 'Yes, reset',
      onClick: () => popup.close(() => { Save.reset(); this.scene.restart(); }),
      variant: 'ad',
    });
    const no = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, {
      label: 'Cancel', onClick: () => popup.close(), scale: 0.8,
    });
    popup.addContent(title, sub, yes, no);
  }
}
