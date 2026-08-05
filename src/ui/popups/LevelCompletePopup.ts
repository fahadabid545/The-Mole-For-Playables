import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';

interface Opts {
  level: number;
  stars: number;
  score: number;
  onNext: () => void;
  onMenu: () => void;
}

export class LevelCompletePopup extends Popup {
  constructor(scene: Phaser.Scene, o: Opts) {
    super(scene);
    Audio.play('win');

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, `Level ${o.level} Complete!`, {
      fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '48px', color: '#3e2723',
    }).setOrigin(0.5);

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

    const scoreText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `Score: ${o.score}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '32px', color: '#3e2723',
    }).setOrigin(0.5);

    const nextBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, {
      label: 'Next Level', onClick: () => this.close(o.onNext),
    });
    const menuBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, {
      label: 'Menu', onClick: () => this.close(o.onMenu), scale: 0.8,
    });

    this.addContent(title, ...starObjs, scoreText, nextBtn, menuBtn);
    this.spawnConfetti();
  }

  private spawnConfetti(): void {
    const em = this.scene.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 250, TX.confetti, {
      x: { min: -180, max: 180 },
      y: 0,
      lifespan: 1800,
      speedY: { min: 200, max: 350 },
      speedX: { min: -120, max: 120 },
      rotate: { start: 0, end: 720 },
      tint: [0xff5252, 0xffca28, 0x66bb6a, 0x42a5f5, 0xab47bc],
      scale: { start: 1, end: 0.8 },
      alpha: { start: 1, end: 0 },
      frequency: 40,
      duration: 700,
    });
    em.setDepth(21000);
    this.scene.time.delayedCall(2500, () => em.destroy());
  }
}
