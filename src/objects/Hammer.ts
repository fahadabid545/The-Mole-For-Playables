import Phaser from 'phaser';
import { TX } from './TextureFactory';

export class Hammer extends Phaser.GameObjects.Image {
  private swinging = false;

  constructor(scene: Phaser.Scene) {
    // Start at the currently-hovered pointer position (desktop) or
    // scene center (touch / mouse hasn't moved yet) so the hammer is
    // visible from the very first frame.
    const p = scene.input.activePointer;
    const startX = (p && p.x > 0) ? p.worldX : scene.scale.width / 2;
    const startY = (p && p.y > 0) ? p.worldY : scene.scale.height / 2;
    super(scene, startX, startY, TX.hammer);
    this.setOrigin(0.3, 0.85);
    this.setDepth(10000);
    scene.add.existing(this);

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.moveTo(p.worldX, p.worldY));
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.moveTo(p.worldX, p.worldY); this.swing(); });
    scene.input.on('pointerup', () => { this.swinging = false; });
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
