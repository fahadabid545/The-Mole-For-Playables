import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';
import { Save } from '../../services/SaveService';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';

interface Opts {
  level: number;
  onRetry: () => void;
  onWatchAdForLife: () => void;
  onMenu: () => void;
}

export class LevelFailedPopup extends Popup {
  constructor(scene: Phaser.Scene, o: Opts) {
    super(scene);
    Audio.play('fail');

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, I18n.t('levelFailed', { n: o.level }),
      TS.title('#b71c1c')).setOrigin(0.5);

    // Friendly mascot with a paw on your shoulder
    const paw = scene.add.image(GAME_WIDTH / 2 - 180, GAME_HEIGHT / 2 - 70, TX.paw).setOrigin(0.5).setAngle(-20);
    scene.tweens.add({ targets: paw, x: '+=40', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60,
      I18n.t('encourage'), { ...TS.body('#3e2723'), align: 'center', fontSize: '30px' }).setOrigin(0.5);

    const livesText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20,
      I18n.t('livesLeft', { n: Save.get().lives }), TS.h2('#5d4037')).setOrigin(0.5);

    const retry = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, {
      label: I18n.t('retry'), onClick: () => this.close(o.onRetry),
    });
    const adBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, {
      label: I18n.t('plusOneLifeAd'), onClick: () => this.close(o.onWatchAdForLife), variant: 'ad',
    });
    const menu = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 270, {
      label: I18n.t('menu'), onClick: () => this.close(o.onMenu), scale: 0.7,
    });

    this.addContent(title, paw, msg, livesText, retry, adBtn, menu);
  }
}
