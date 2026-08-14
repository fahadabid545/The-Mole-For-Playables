import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class ParallaxJungle extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // If a single bg-jungle sprite is dropped into src/assets/sprites/,
    // use it as the full backdrop and skip the 7-layer procedural stack.
    if (scene.textures.exists(TX.bgJungle)) {
      const bg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgJungle).setOrigin(0.5);
      // Fill the game viewport regardless of source resolution.
      const src = bg.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const sw = (src as any).naturalWidth || (src as any).width || GAME_WIDTH;
      const sh = (src as any).naturalHeight || (src as any).height || GAME_HEIGHT;
      const scale = Math.max(GAME_WIDTH / sw, GAME_HEIGHT / sh);
      bg.setScale(scale);
      this.add(bg);
      scene.add.existing(this);
      this.setDepth(-1000);
      // Subtle breathing zoom so the static art feels alive.
      scene.tweens.add({ targets: bg, scale: scale * 1.02, yoyo: true, repeat: -1,
        duration: 6000, ease: 'Sine.InOut' });
      return;
    }

    const sky = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgSky).setOrigin(0.5);
    const rays = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgSunrays).setOrigin(0.5).setBlendMode(Phaser.BlendModes.ADD);
    const mountains = scene.add.image(GAME_WIDTH / 2, 460, TX.bgMountains).setOrigin(0.5);
    const far = scene.add.image(GAME_WIDTH / 2, 560, TX.bgTreesFar).setOrigin(0.5, 0.5);
    const near = scene.add.image(GAME_WIDTH / 2, 0, TX.bgTreesNear).setOrigin(0.5, 0);
    const ground = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 640, TX.bgGround).setOrigin(0.5, 0);
    const fg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 80, TX.bgLeavesFg).setOrigin(0.5);

    this.add([sky, rays, mountains, far, near, ground, fg]);
    scene.add.existing(this);
    this.setDepth(-1000);

    scene.tweens.add({ targets: rays, alpha: { from: 0.85, to: 1 }, yoyo: true, repeat: -1, duration: 4000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: near, x: '+=6', yoyo: true, repeat: -1, duration: 5000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: far,  x: '-=4', yoyo: true, repeat: -1, duration: 7000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: fg,   y: '+=3', yoyo: true, repeat: -1, duration: 3200, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: mountains, x: '+=3', yoyo: true, repeat: -1, duration: 9000, ease: 'Sine.InOut' });
  }
}
