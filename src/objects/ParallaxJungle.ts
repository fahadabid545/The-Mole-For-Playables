import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class ParallaxJungle extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    const sky = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgSky).setOrigin(0.5);
    const far = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgTreesFar).setOrigin(0.5);
    const near = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgTreesNear).setOrigin(0.5);
    const ground = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 350, TX.bgGround).setOrigin(0.5);
    const fg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 130, TX.bgLeavesFg).setOrigin(0.5);

    this.add([sky, far, near, ground, fg]);
    scene.add.existing(this);
    this.setDepth(-1000);

    // Gentle sway
    scene.tweens.add({ targets: near, x: '+=6', yoyo: true, repeat: -1, duration: 5000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: far,  x: '-=4', yoyo: true, repeat: -1, duration: 7000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: fg,   y: '+=3', yoyo: true, repeat: -1, duration: 3200, ease: 'Sine.InOut' });
  }
}
