import Phaser from 'phaser';

export function spawnScorePopup(scene: Phaser.Scene, x: number, y: number, text: string, color = '#fff176'): void {
  const t = scene.add.text(x, y, text, {
    fontFamily: 'Impact, "Arial Black", sans-serif',
    fontSize: '48px',
    color,
    stroke: '#3e2723',
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(9999);
  scene.tweens.add({
    targets: t,
    y: y - 100,
    alpha: 0,
    duration: 700,
    ease: 'Cubic.Out',
    onComplete: () => t.destroy(),
  });
}
