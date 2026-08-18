import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import type { Category } from '../config/CategoryConfig';

const LEVEL_TINTS: Record<string, { sky: number; foliage: number }[]> = {
  easy: [
    { sky: 0xffffff, foliage: 0xffffff },
    { sky: 0xffe0b2, foliage: 0xc8e6c9 },
    { sky: 0xffccbc, foliage: 0xa5d6a7 },
    { sky: 0xb3e5fc, foliage: 0x81c784 },
    { sky: 0xe1bee7, foliage: 0x66bb6a },
  ],
  hard: [
    { sky: 0xfff8e1, foliage: 0xffe082 },
    { sky: 0xffe0b2, foliage: 0xffcc80 },
    { sky: 0xffccbc, foliage: 0xffab91 },
    { sky: 0xffd180, foliage: 0xffa726 },
    { sky: 0xffab40, foliage: 0xff8f00 },
  ],
  superHard: [
    { sky: 0xffcdd2, foliage: 0xef9a9a },
    { sky: 0xef9a9a, foliage: 0xe57373 },
    { sky: 0xe0e0e0, foliage: 0xbdbdbd },
    { sky: 0xcfd8dc, foliage: 0xb0bec5 },
    { sky: 0xb0bec5, foliage: 0x90a4ae },
  ],
};

function levelTint(level: number, category: Category = 'easy'): { sky: number; foliage: number } {
  const tints = LEVEL_TINTS[category] || LEVEL_TINTS.easy;
  if (level <= 0) return tints[0];
  const band = Math.min(tints.length - 1, Math.floor((level - 1) / 10));
  return tints[band];
}

export class ParallaxJungle extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, level = 0, category: Category = 'easy') {
    super(scene, 0, 0);

    const tint = levelTint(level, category);
    const sky = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgSky).setOrigin(0.5).setTint(tint.sky);
    const rays = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgSunrays).setOrigin(0.5).setBlendMode(Phaser.BlendModes.ADD);
    const mountains = scene.add.image(GAME_WIDTH / 2, 460, TX.bgMountains).setOrigin(0.5);
    const far = scene.add.image(GAME_WIDTH / 2, 560, TX.bgTreesFar).setOrigin(0.5, 0.5).setTint(tint.foliage);
    const near = scene.add.image(GAME_WIDTH / 2, 0, TX.bgTreesNear).setOrigin(0.5, 0).setTint(tint.foliage);

    const ground = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 640, TX.bgGround).setOrigin(0.5, 0);
    const fg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 80, TX.bgLeavesFg).setOrigin(0.5).setTint(tint.foliage);

    this.add([sky, rays, mountains, far, near, ground, fg]);
    scene.add.existing(this);
    this.setDepth(-1000);

    // Ambient motion
    scene.tweens.add({ targets: rays, alpha: { from: 0.85, to: 1 }, yoyo: true, repeat: -1, duration: 4000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: near, x: '+=6', yoyo: true, repeat: -1, duration: 5000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: far,  x: '-=4', yoyo: true, repeat: -1, duration: 7000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: fg,   y: '+=3', yoyo: true, repeat: -1, duration: 3200, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: mountains, x: '+=3', yoyo: true, repeat: -1, duration: 9000, ease: 'Sine.InOut' });
  }
}
