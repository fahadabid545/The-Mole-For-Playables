import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';
import { Save } from '../../services/SaveService';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';
import { IS_PLAYABLES } from '../../config/BuildFlags';

interface Opts {
  level: number;
  onRetry: () => void;
  onWatchAdForLife: () => void;
  onMenu: () => void;
  onChallenges?: () => void;
}

export class LevelFailedPopup extends Popup {
  constructor(scene: Phaser.Scene, o: Opts) {
    super(scene, { entrance: 'slide-up' });
    Audio.play('fail');

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, I18n.t('levelFailed', { n: o.level }),
      TS.title('#b71c1c')).setOrigin(0.5);

    const paw = scene.add.image(GAME_WIDTH / 2 - 180, GAME_HEIGHT / 2 - 100, TX.paw).setOrigin(0.5).setAngle(-20);
    scene.tweens.add({ targets: paw, x: '+=40', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80,
      I18n.t('encourage'), { ...TS.body('#3e2723'), align: 'center', fontSize: '30px' }).setOrigin(0.5);

    const livesText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10,
      I18n.t('livesLeft', { n: Save.get().lives }), TS.h2('#5d4037')).setOrigin(0.5);

    const retry = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, {
      label: I18n.t('retry'), onClick: () => this.close(o.onRetry),
    });
    this.addContent(title, paw, msg, livesText, retry);

    if (IS_PLAYABLES) {
      // No ads — nudge the player to try a challenge for a free life
      const chalMsg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 155,
        'Complete a Daily Challenge (+1 life) or a Weekly Challenge (+3 lives)',
        { ...TS.body('#2b1810'), align: 'center', fontSize: '22px', wordWrap: { width: 520 } })
        .setOrigin(0.5);
      this.addContent(chalMsg);
      if (o.onChallenges) {
        const chalBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 230, {
          label: 'Challenges', onClick: () => this.close(o.onChallenges!), variant: 'ad',
        });
        this.addContent(chalBtn);
      }
    } else {
      const adBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, {
        label: I18n.t('plusOneLifeAd'), onClick: () => this.close(o.onWatchAdForLife), variant: 'ad',
      });
      this.addContent(adBtn);
    }

    const menu = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 320, {
      label: I18n.t('menu'), onClick: () => this.close(o.onMenu), scale: 0.7,
    });
    this.addContent(menu);
  }
}
