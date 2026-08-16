import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';
import { TX } from '../../objects/TextureFactory';
import { spawnConfetti } from '../../utils/Celebration';

interface Opts {
  level: number;
  stars: number;
  score: number;
  onNext: () => void;
  onRetry?: () => void;
  onMenu: () => void;
}

export class LevelCompletePopup extends Popup {
  constructor(scene: Phaser.Scene, o: Opts) {
    super(scene, { closeable: true, onCloseX: o.onMenu });
    Audio.play('win');

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, I18n.t('levelComplete', { n: o.level }),
      TS.title('#2e7d32')).setOrigin(0.5);

    const starObjs: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 3; i++) {
      const s = scene.add.image(GAME_WIDTH / 2 + (i - 1) * 110, GAME_HEIGHT / 2 - 60, TX.star)
        .setOrigin(0.5).setScale(0);
      starObjs.push(s);
      if (i < o.stars) {
        scene.tweens.add({ targets: s, scale: 1.4, duration: 250, delay: 200 + i * 200, ease: 'Back.Out' });
        scene.tweens.add({ targets: s, scale: 1.2, duration: 200, delay: 450 + i * 200 });
      } else {
        s.setAlpha(0.3); s.setScale(1);
      }
    }

    const scoreText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, I18n.t('score', { n: o.score }),
      { ...TS.h2('#3e2723'), fontSize: '36px' }).setOrigin(0.5);

    const nextBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, {
      label: I18n.t('next'), onClick: () => this.close(o.onNext),
    });
    const retryBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, {
      label: I18n.t('retry'), onClick: () => this.close(o.onRetry ?? o.onMenu), scale: 0.85,
    });
    const menuBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 320, {
      label: I18n.t('menu'), onClick: () => this.close(o.onMenu), scale: 0.8,
    });

    this.addContent(title, ...starObjs, scoreText, nextBtn, retryBtn, menuBtn);
    spawnConfetti(scene);
  }
}
