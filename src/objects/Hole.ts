import Phaser from 'phaser';
import { TX } from './TextureFactory';

export class Hole extends Phaser.GameObjects.Container {
  public readonly holeIndex: number;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number) {
    super(scene, x, y);
    this.holeIndex = index;

    const shadow = scene.add.image(0, 60, TX.logHoleShadow).setOrigin(0.5);
    const log = scene.add.image(0, 0, TX.logHole).setOrigin(0.5);
    this.add([shadow, log]);
    scene.add.existing(this);
    this.setDepth(y);
  }
}
