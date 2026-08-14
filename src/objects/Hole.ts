import Phaser from 'phaser';
import { TX } from './TextureFactory';

export class Hole extends Phaser.GameObjects.Container {
  public readonly holeIndex: number;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number, displayW: number = 180) {
    super(scene, x, y);
    this.holeIndex = index;

    const shadow = scene.add.image(0, displayW * 0.34, TX.logHoleShadow).setOrigin(0.5);
    // Shadow: match log width, stay short.
    shadow.setDisplaySize(displayW * 0.95, Math.max(16, displayW * 0.14));

    const log = scene.add.image(0, 0, TX.logHole).setOrigin(0.5);
    // Preserve source aspect ratio while capping width to displayW.
    const src = log.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const sw = (src as any).naturalWidth || (src as any).width || log.width;
    const sh = (src as any).naturalHeight || (src as any).height || log.height;
    const scale = displayW / sw;
    log.setDisplaySize(displayW, sh * scale);

    this.add([shadow, log]);
    scene.add.existing(this);
    this.setDepth(y);
  }
}
