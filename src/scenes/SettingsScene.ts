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
import { IS_PORTAL } from '../config/BuildFlags';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 175, 'SETTINGS', TS.title()).setOrigin(0.5).setDepth(100);

    let y = 340;
    this.add.text(80, y, 'Sound', TS.h2('#ffd54f')).setOrigin(0, 0.5);
    const soundBg = this.add.circle(GAME_WIDTH - 100, y, 42, 0x2b1810, 0.55)
      .setStrokeStyle(3, 0xffb300).setInteractive({ useHandCursor: true });
    const soundIcon = this.add.image(GAME_WIDTH - 100, y, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5);
    soundBg.on('pointerdown', () => {
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
    if (!IS_PORTAL) {
      y = 600;
      new Button(this, GAME_WIDTH / 2, y, {
        label: 'Show Ad (test)',
        onClick: () => { void Ads.showInterstitial(); },
        scale: 0.85, variant: 'ad',
      });
    }

    y = GAME_HEIGHT - 600;
    new Button(this, GAME_WIDTH / 2, y, {
      label: 'Reset Stats Only',
      onClick: () => {
        Save.resetStatsOnly();
        this.scene.restart();
      },
      scale: 0.85,
    });
    y = GAME_HEIGHT - 490;
    new Button(this, GAME_WIDTH / 2, y, {
      label: 'Reset Progress',
      onClick: () => this.confirmReset(),
      scale: 0.9, variant: 'ad',
    });

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
