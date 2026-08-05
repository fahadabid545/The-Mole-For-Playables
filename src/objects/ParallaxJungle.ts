import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class ParallaxJungle extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const sky = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgSky).setOrigin(0.5);
    const far = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgTreesFar).setOrigin(0.5);
    const near = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TX.bgTreesNear).setOrigin(0.5);

    // River flows across upper mid — behind ground
    const river = scene.add.image(GAME_WIDTH / 2, 340, TX.bgRiver).setOrigin(0.5).setAlpha(0.9);
    // Flow illusion: sample two overlapping river tiles offset each other
    const river2 = scene.add.image(GAME_WIDTH / 2 - 40, 340, TX.bgRiver).setOrigin(0.5).setAlpha(0.55).setScale(1.05, 1);

    const ground = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 350, TX.bgGround).setOrigin(0.5);

    // Hanging vines from the top — three of them
    const vines: Phaser.GameObjects.Image[] = [];
    [140, 360, 580].forEach((x, i) => {
      const v = scene.add.image(x, 0, TX.vine).setOrigin(0.5, 0).setDepth(-500);
      v.setScale(0.85 + i * 0.07, 0.9 + (i % 2) * 0.1);
      vines.push(v);
    });

    const fg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 130, TX.bgLeavesFg).setOrigin(0.5);

    this.add([sky, far, near, river, river2, ...vines, ground, fg]);
    scene.add.existing(this);
    this.setDepth(-1000);

    // Ambient motions
    scene.tweens.add({ targets: near, x: '+=6', yoyo: true, repeat: -1, duration: 5000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: far,  x: '-=4', yoyo: true, repeat: -1, duration: 7000, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: fg,   y: '+=3', yoyo: true, repeat: -1, duration: 3200, ease: 'Sine.InOut' });
    // Flowing river
    scene.tweens.add({ targets: river,  x: '+=80', repeat: -1, duration: 4000, ease: 'Linear',
      onRepeat: () => river.setX(GAME_WIDTH / 2 - 80) });
    scene.tweens.add({ targets: river2, x: '+=120', repeat: -1, duration: 3200, ease: 'Linear',
      onRepeat: () => river2.setX(GAME_WIDTH / 2 - 160) });
    // Hanging vine sway
    vines.forEach((v, i) => {
      v.setOrigin(0.5, 0);
      scene.tweens.add({ targets: v, angle: 4, yoyo: true, repeat: -1,
        duration: 2600 + i * 400, ease: 'Sine.InOut', delay: i * 150 });
    });
  }
}
