import Phaser from 'phaser';
import { TX } from './TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSeason, SEASONAL_LEAF_TINTS } from '../utils/Seasonal';

export function spawnLeafParticles(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
  const emitter = scene.add.particles(0, -20, TX.leafParticle, {
    x: { min: 0, max: GAME_WIDTH },
    y: -20,
    lifespan: 8000,
    speedY: { min: 30, max: 70 },
    speedX: { min: -20, max: 40 },
    rotate: { start: 0, end: 360 },
    scale: { start: 0.7, end: 0.9 },
    alpha: { start: 0.9, end: 0.7 },
    tint: SEASONAL_LEAF_TINTS[getSeason()],
    frequency: 900,
    gravityY: 6,
    bounds: new Phaser.Geom.Rectangle(0, -20, GAME_WIDTH, GAME_HEIGHT + 40),
  });
  emitter.setDepth(-500);
  return emitter;
}
