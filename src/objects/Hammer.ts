import Phaser from 'phaser';
import { TX } from './TextureFactory';

export class Hammer extends Phaser.GameObjects.Image {
  private swinging = false;

  constructor(scene: Phaser.Scene) {
    super(scene, -200, -200, TX.hammer);
    this.setOrigin(0.3, 0.85);
    this.setDepth(10000);
    scene.add.existing(this);

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.moveTo(p.worldX, p.worldY));
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.moveTo(p.worldX, p.worldY); this.swing(); });
    scene.input.on('pointerup', () => this.swinging = false);
  }

  moveTo(x: number, y: number): void {
    this.setPosition(x, y);
  }

  swing(): void {
    if (this.swinging) return;
    this.swinging = true;
    this.setAngle(-40);
    this.scene.tweens.add({
      targets: this,
      angle: 20,
      duration: 90,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => { this.setAngle(0); this.swinging = false; },
    });
  }
}
