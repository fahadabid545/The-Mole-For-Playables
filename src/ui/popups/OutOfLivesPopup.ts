import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';

interface Opts {
  levelToUnlock?: number;
  onWatchAdForLife: () => void;
  onWatchAdToUnlock?: () => void;
  onMenu: () => void;
}

export class OutOfLivesPopup extends Popup {
  constructor(scene: Phaser.Scene, o: Opts) {
    super(scene);

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, 'Out of Lives', {
      fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '48px', color: '#b71c1c',
    }).setOrigin(0.5);

    const hearts: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 5; i++) {
      const h = scene.add.image(GAME_WIDTH / 2 + (i - 2) * 60, GAME_HEIGHT / 2 - 90, TX.heartEmpty)
        .setOrigin(0.5).setScale(0.9);
      hearts.push(h);
    }

    const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Watch an ad to keep playing.', {
      fontFamily: 'Arial, sans-serif', fontSize: '26px', color: '#3e2723', align: 'center',
    }).setOrigin(0.5);

    const adLife = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, {
      label: '+1 Life  (Watch Ad)', onClick: () => this.close(o.onWatchAdForLife), variant: 'ad',
    });

    this.addContent(title, ...hearts, msg, adLife);

    if (o.levelToUnlock && o.onWatchAdToUnlock) {
      const unlock = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 165, {
        label: `Unlock L${o.levelToUnlock}  (Watch Ad)`,
        onClick: () => this.close(o.onWatchAdToUnlock),
        variant: 'ad',
      });
      this.addContent(unlock);
    }

    const menu = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 250, {
      label: 'Menu', onClick: () => this.close(o.onMenu), scale: 0.7,
    });
    this.addContent(menu);
  }
}
