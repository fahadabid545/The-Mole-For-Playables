import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { I18n, LANGS, Lang } from '../../services/I18nService';
import { Save } from '../../services/SaveService';
import { Audio } from '../../services/AudioService';

export class WelcomePopup extends Popup {
  constructor(scene: Phaser.Scene, onDone: () => void) {
    super(scene);

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 190, I18n.t('welcome'), {
      fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '58px', color: '#2e7d32',
    }).setOrigin(0.5);

    const sub = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 125, I18n.t('chooseLanguage'), {
      fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#3e2723',
    }).setOrigin(0.5);

    this.addContent(title, sub);

    LANGS.forEach((l, i) => {
      const y = GAME_HEIGHT / 2 - 60 + i * 60;
      const btn = new Button(scene, GAME_WIDTH / 2, y, {
        label: l.label,
        onClick: () => {
          Audio.play('click');
          I18n.setLang(l.code as Lang);
          Save.setLang(l.code as Lang);
          Save.setWelcomed();
          this.close(onDone);
        },
        scale: 0.75,
      });
      this.addContent(btn);
    });
  }
}
