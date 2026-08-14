import Phaser from 'phaser';
import { TX } from './TextureFactory';

// New art: an upright wooden STUMP (roughly square PNG) with the hole
// on its TOP face. The container is placed at the grid cell centre and
// the sprite hangs symmetrically from there.

export class Hole extends Phaser.GameObjects.Container {
  public readonly holeIndex: number;
  public readonly displayW: number;
  public readonly holeOpeningY: number;   // world Y of the visible hole rim

  constructor(scene: Phaser.Scene, x: number, y: number, index: number, displayW: number = 180) {
    super(scene, x, y);
    this.holeIndex = index;
    this.displayW = displayW;

    // Ground shadow beneath the stump.
    const shadow = scene.add.image(0, displayW * 0.45, TX.logHoleShadow).setOrigin(0.5);
    shadow.setDisplaySize(displayW * 0.9, Math.max(14, displayW * 0.12));

    const stump = scene.add.image(0, 0, TX.logHole).setOrigin(0.5);
    const src = stump.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const sw = (src as any).naturalWidth || (src as any).width || stump.width;
    const sh = (src as any).naturalHeight || (src as any).height || stump.height;
    const scale = displayW / sw;
    const dh = sh * scale;
    stump.setDisplaySize(displayW, dh);

    // The dark hole opening in the new stump art is roughly 33% down
    // from the sprite's top edge. Publish the world Y so Raccoon can
    // rise to exactly that height and read as popping out of the hole.
    this.holeOpeningY = y - dh / 2 + dh * 0.33;

    this.add([shadow, stump]);
    scene.add.existing(this);
    this.setDepth(y);
  }
}
