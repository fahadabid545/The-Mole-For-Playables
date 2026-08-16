import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';

export function spawnConfetti(scene: Phaser.Scene, x = GAME_WIDTH / 2, y = GAME_HEIGHT / 2 - 200): void {
  const em = scene.add.particles(x, y, TX.confetti, {
    x: { min: -200, max: 200 },
    y: 0,
    lifespan: 1600,
    speedY: { min: 180, max: 340 },
    speedX: { min: -140, max: 140 },
    rotate: { start: 0, end: 720 },
    tint: [0xff5252, 0xffca28, 0x66bb6a, 0x42a5f5, 0xab47bc],
    scale: { start: 1, end: 0.7 },
    alpha: { start: 1, end: 0 },
    frequency: 35,
    duration: 600,
  });
  em.setDepth(21000);
  scene.time.delayedCall(2200, () => em.destroy());
}

export function celebrateBossDown(scene: Phaser.Scene, x: number, y: number): void {
  spawnConfetti(scene, x, y - 100);
  Audio.play('win');
  scene.cameras.main.shake(200, 0.015);
  if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
}

export function celebrateComboMilestone(scene: Phaser.Scene, combo: number): void {
  if (combo !== 5 && combo !== 10 && combo !== 15 && combo !== 20) return;
  const label = `${combo}x COMBO!`;
  const t = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, label, {
    fontFamily: '"Luckiest Guy", Impact, sans-serif',
    fontSize: combo >= 15 ? '64px' : '52px',
    color: combo >= 15 ? '#f44336' : combo >= 10 ? '#ff9800' : '#ffd54f',
    stroke: '#3e2723', strokeThickness: 6,
  }).setOrigin(0.5).setDepth(20000).setAlpha(0).setScale(0.3);

  scene.tweens.add({ targets: t, alpha: 1, scale: 1.2, duration: 200, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, alpha: 0, y: t.y - 60, delay: 800, duration: 400,
    onComplete: () => t.destroy() });

  if (combo >= 10) {
    spawnConfetti(scene);
    scene.cameras.main.shake(120, 0.008);
  }
}
