import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';

export class ExtraLifePopup extends Popup {
  constructor(scene: Phaser.Scene, onOk: () => void) {
    super(scene, { closeable: true, onCloseX: onOk, entrance: 'bounce' });
    Audio.play('extraLife');

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, I18n.t('extraLife'),
      TS.title('#2e7d32')).setOrigin(0.5);

    const heart = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, TX.heartFull).setOrigin(0.5).setScale(0);
    scene.tweens.add({ targets: heart, scale: 2.2, duration: 400, ease: 'Back.Out' });
    scene.tweens.add({ targets: heart, scale: 2.0, duration: 500, delay: 400, yoyo: true, repeat: -1 });

    const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100,
      I18n.t('extraLifeMsg'), { ...TS.body('#3e2723'), align: 'center', fontSize: '28px' }).setOrigin(0.5);

    const btn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 200, {
      label: I18n.t('awesome'), onClick: () => this.close(onOk),
    });

    this.addContent(title, heart, msg, btn);
  }
}
