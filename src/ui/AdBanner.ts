import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { FLAGS } from '../config/BuildFlags';
import { Ads } from '../services/AdsService';

const BANNER_H = 100;

export class AdBanner extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, GAME_HEIGHT);
    this.bg = scene.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH, BANNER_H, COLORS.woodDark, 1).setOrigin(0.5, 1);
    this.label = scene.add.text(GAME_WIDTH / 2, -BANNER_H / 2, 'Ad', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#fffde7',
    }).setOrigin(0.5);
    this.add([this.bg, this.label]);
    scene.add.existing(this);
    this.setDepth(5000);
    this.setVisible(false);
  }

  show(): void {
    if (!FLAGS.bottomBanner) return;
    this.setVisible(true);
    Ads.showBanner();
  }
  hide(): void {
    this.setVisible(false);
    Ads.hideBanner();
  }
}
