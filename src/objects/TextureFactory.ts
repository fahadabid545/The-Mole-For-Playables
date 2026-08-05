import Phaser from 'phaser';
import { COLORS } from '../config/GameConfig';

// All textures are generated at runtime with Phaser.Graphics — no binary assets.
// Real art can later be dropped into public/assets and loaded in PreloadScene
// under the same texture keys; the game will pick those up automatically.

export const TX = {
  bgSky: 'tx-bg-sky',
  bgTreesFar: 'tx-bg-trees-far',
  bgTreesNear: 'tx-bg-trees-near',
  bgLeavesFg: 'tx-bg-leaves-fg',
  leafParticle: 'tx-leaf-particle',
  logHole: 'tx-log-hole',
  logHoleShadow: 'tx-log-hole-shadow',
  raccoon: 'tx-raccoon',
  raccoonHit: 'tx-raccoon-hit',
  raccoonGolden: 'tx-raccoon-golden',
  bomb: 'tx-bomb',
  hammer: 'tx-hammer',
  spark: 'tx-spark',
  dust: 'tx-dust',
  heartFull: 'tx-heart-full',
  heartEmpty: 'tx-heart-empty',
  star: 'tx-star',
  panel: 'tx-panel',
  button: 'tx-button',
  buttonPressed: 'tx-button-pressed',
  buttonAd: 'tx-button-ad',
  confetti: 'tx-confetti',
  paw: 'tx-paw',
  soundOn: 'tx-sound-on',
  soundOff: 'tx-sound-off',
  pause: 'tx-pause',
} as const;

function makeTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics({ x: 0, y: 0 });
  g.clear();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function buildAllTextures(scene: Phaser.Scene): void {
  buildSky(scene);
  buildTreesFar(scene);
  buildTreesNear(scene);
  buildLeavesFg(scene);
  buildLeafParticle(scene);
  buildLogHole(scene);
  buildLogHoleShadow(scene);
  buildRaccoon(scene, TX.raccoon, COLORS.raccoonBody, COLORS.raccoonFur, false);
  buildRaccoon(scene, TX.raccoonHit, COLORS.raccoonBody, COLORS.raccoonFur, true);
  buildRaccoon(scene, TX.raccoonGolden, COLORS.gold, 0xfff59d, false);
  buildBomb(scene);
  buildHammer(scene);
  buildSpark(scene);
  buildDust(scene);
  buildHeart(scene, TX.heartFull, COLORS.heart, 1);
  buildHeart(scene, TX.heartEmpty, COLORS.heartEmpty, 0.35);
  buildStar(scene);
  buildPanel(scene);
  buildButton(scene, TX.button, 0x66bb6a, 0x2e7d32);
  buildButton(scene, TX.buttonPressed, 0x2e7d32, 0x1b5e20);
  buildButton(scene, TX.buttonAd, 0xffb300, 0xe65100);
  buildConfetti(scene);
  buildPaw(scene);
  buildSoundIcon(scene, TX.soundOn, true);
  buildSoundIcon(scene, TX.soundOff, false);
  buildPauseIcon(scene);
}

// ----- individual builders -----

function buildSky(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgSky, 720, 1280, g => {
    g.fillGradientStyle(COLORS.skyTop, COLORS.skyTop, COLORS.skyBottom, COLORS.skyBottom, 1);
    g.fillRect(0, 0, 720, 1280);
    g.fillStyle(0xffffff, 0.35);
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 110;
      const y = 120 + (i % 2) * 60;
      g.fillEllipse(x, y, 130, 40);
    }
  });
}

function buildTreesFar(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgTreesFar, 720, 1280, g => {
    g.fillStyle(COLORS.leafMid, 0.6);
    for (let x = -20; x < 760; x += 90) {
      const h = 260 + Math.sin(x * 0.03) * 60;
      g.fillTriangle(x - 60, 900, x + 60, 900, x, 900 - h);
    }
    g.fillStyle(COLORS.leafDark, 0.55);
    for (let x = 0; x < 720; x += 120) {
      const h = 340 + Math.cos(x * 0.02) * 80;
      g.fillTriangle(x - 80, 950, x + 80, 950, x, 950 - h);
    }
  });
}

function buildTreesNear(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgTreesNear, 720, 1280, g => {
    // Trunks
    g.fillStyle(COLORS.woodDark, 1);
    g.fillRect(30, 0, 60, 1280);
    g.fillRect(630, 0, 60, 1280);
    // Leaf canopy at top
    g.fillStyle(COLORS.leafDark, 1);
    g.fillCircle(60, 120, 130);
    g.fillCircle(660, 120, 130);
    g.fillStyle(COLORS.leafMid, 1);
    g.fillCircle(90, 180, 90);
    g.fillCircle(630, 180, 90);
    // Vines
    g.lineStyle(6, COLORS.leafMid, 0.9);
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 8;
      g.beginPath();
      g.moveTo(x, 200);
      for (let y = 200; y < 600; y += 20) g.lineTo(x + Math.sin(y * 0.05) * 12, y);
      g.strokePath();
    }
    for (let i = 0; i < 4; i++) {
      const x = 630 - i * 8;
      g.beginPath();
      g.moveTo(x, 200);
      for (let y = 200; y < 600; y += 20) g.lineTo(x + Math.sin(y * 0.05 + 1) * 12, y);
      g.strokePath();
    }
  });
}

function buildLeavesFg(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgLeavesFg, 720, 260, g => {
    g.fillStyle(COLORS.leafDark, 1);
    for (let x = -40; x < 760; x += 60) {
      const y = 40 + (x % 120) * 0.5;
      g.fillEllipse(x, y, 90, 60);
    }
    g.fillStyle(COLORS.leafMid, 0.9);
    for (let x = -20; x < 760; x += 60) {
      g.fillEllipse(x, 90 + (x % 100) * 0.4, 100, 66);
    }
  });
}

function buildLeafParticle(scene: Phaser.Scene) {
  makeTexture(scene, TX.leafParticle, 40, 24, g => {
    g.fillStyle(COLORS.leafLight, 1);
    g.fillEllipse(20, 12, 36, 18);
    g.lineStyle(2, COLORS.leafDark, 1);
    g.beginPath(); g.moveTo(4, 12); g.lineTo(36, 12); g.strokePath();
  });
}

function buildLogHole(scene: Phaser.Scene) {
  const r = 100;
  makeTexture(scene, TX.logHole, r * 2 + 20, r * 2 + 60, g => {
    // Log rim (front)
    g.fillStyle(COLORS.woodLight, 1);
    g.fillEllipse(r + 10, r + 20, r * 2, r * 1.4);
    g.fillStyle(COLORS.woodDark, 1);
    g.fillEllipse(r + 10, r + 10, r * 2 - 20, r * 1.2);
    // Inner dark
    g.fillStyle(0x000000, 1);
    g.fillEllipse(r + 10, r + 10, r * 1.6, r * 0.9);
    // Wood ring texture
    g.lineStyle(3, COLORS.wood, 0.7);
    g.strokeEllipse(r + 10, r + 20, r * 2, r * 1.4);
    g.lineStyle(2, COLORS.wood, 0.4);
    g.strokeEllipse(r + 10, r + 22, r * 2 - 12, r * 1.3);
  });
}

function buildLogHoleShadow(scene: Phaser.Scene) {
  makeTexture(scene, TX.logHoleShadow, 240, 60, g => {
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(120, 30, 220, 40);
  });
}

function buildRaccoon(scene: Phaser.Scene, key: string, bodyColor: number, furColor: number, dizzy: boolean) {
  makeTexture(scene, key, 180, 180, g => {
    // Body
    g.fillStyle(bodyColor, 1);
    g.fillEllipse(90, 110, 130, 120);
    // Belly
    g.fillStyle(furColor, 1);
    g.fillEllipse(90, 130, 80, 70);
    // Head
    g.fillStyle(bodyColor, 1);
    g.fillEllipse(90, 70, 110, 90);
    // Ears
    g.fillStyle(bodyColor, 1);
    g.fillTriangle(40, 45, 30, 10, 70, 30);
    g.fillTriangle(140, 45, 150, 10, 110, 30);
    g.fillStyle(COLORS.raccoonNose, 0.8);
    g.fillTriangle(45, 40, 40, 20, 62, 30);
    g.fillTriangle(135, 40, 140, 20, 118, 30);
    // Mask
    g.fillStyle(COLORS.raccoonMask, 1);
    g.fillEllipse(65, 72, 40, 26);
    g.fillEllipse(115, 72, 40, 26);
    // Snout white
    g.fillStyle(0xf5f5f5, 1);
    g.fillEllipse(90, 92, 46, 28);
    // Nose
    g.fillStyle(COLORS.raccoonNose, 1);
    g.fillEllipse(90, 84, 14, 10);
    // Eyes
    if (dizzy) {
      g.lineStyle(4, 0xffffff, 1);
      g.strokeCircle(65, 72, 10);
      g.strokeCircle(115, 72, 10);
      g.lineStyle(3, 0xffffff, 1);
      g.beginPath(); g.moveTo(58, 65); g.lineTo(72, 79); g.moveTo(72, 65); g.lineTo(58, 79); g.strokePath();
      g.beginPath(); g.moveTo(108, 65); g.lineTo(122, 79); g.moveTo(122, 65); g.lineTo(108, 79); g.strokePath();
    } else {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(65, 72, 8);
      g.fillCircle(115, 72, 8);
      g.fillStyle(0x000000, 1);
      g.fillCircle(67, 74, 5);
      g.fillCircle(117, 74, 5);
    }
    // Mouth
    g.lineStyle(3, COLORS.raccoonMask, 1);
    g.beginPath();
    g.moveTo(80, 100);
    g.lineTo(90, 106);
    g.lineTo(100, 100);
    g.strokePath();
  });
}

function buildBomb(scene: Phaser.Scene) {
  makeTexture(scene, TX.bomb, 160, 180, g => {
    g.fillStyle(COLORS.bomb, 1);
    g.fillCircle(80, 110, 60);
    g.fillStyle(0x546e7a, 1);
    g.fillCircle(64, 96, 14);
    // Fuse
    g.lineStyle(6, 0x8d6e63, 1);
    g.beginPath(); g.moveTo(80, 50); g.lineTo(70, 30); g.lineTo(90, 20); g.strokePath();
    // Spark
    g.fillStyle(0xffeb3b, 1);
    g.fillCircle(90, 20, 8);
    g.fillStyle(0xff5722, 0.9);
    g.fillCircle(90, 20, 5);
    // Angry face
    g.fillStyle(0xff5252, 1);
    g.fillTriangle(60, 100, 78, 108, 60, 116);
    g.fillTriangle(100, 100, 82, 108, 100, 116);
    g.lineStyle(3, 0xff5252, 1);
    g.strokeRect(72, 128, 16, 4);
  });
}

function buildHammer(scene: Phaser.Scene) {
  makeTexture(scene, TX.hammer, 200, 220, g => {
    // Handle
    g.fillStyle(COLORS.hammerHandle, 1);
    g.fillRoundedRect(85, 70, 30, 150, 8);
    g.fillStyle(COLORS.woodDark, 1);
    g.fillRoundedRect(85, 200, 30, 14, 4);
    // Head plate
    g.fillStyle(COLORS.hammerHeadDark, 1);
    g.fillRoundedRect(20, 20, 160, 80, 16);
    g.fillStyle(COLORS.hammerHead, 1);
    g.fillRoundedRect(28, 24, 144, 60, 12);
    // Shine
    g.fillStyle(0xffffff, 0.5);
    g.fillRoundedRect(40, 32, 60, 12, 6);
    // Rivets
    g.fillStyle(COLORS.hammerHeadDark, 1);
    g.fillCircle(40, 60, 5);
    g.fillCircle(160, 60, 5);
  });
}

function buildSpark(scene: Phaser.Scene) {
  makeTexture(scene, TX.spark, 40, 40, g => {
    g.fillStyle(0xffee58, 1);
    g.fillTriangle(20, 0, 26, 18, 20, 40);
    g.fillTriangle(20, 0, 14, 18, 20, 40);
    g.fillTriangle(0, 20, 18, 14, 40, 20);
    g.fillTriangle(0, 20, 18, 26, 40, 20);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 20, 6);
  });
}

function buildDust(scene: Phaser.Scene) {
  makeTexture(scene, TX.dust, 40, 40, g => {
    g.fillStyle(COLORS.dust, 0.9);
    g.fillCircle(20, 20, 14);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(16, 16, 6);
  });
}

function buildHeart(scene: Phaser.Scene, key: string, color: number, alpha: number) {
  makeTexture(scene, key, 60, 60, g => {
    g.fillStyle(color, alpha);
    g.fillCircle(20, 22, 14);
    g.fillCircle(40, 22, 14);
    g.fillTriangle(6, 26, 54, 26, 30, 54);
    if (alpha < 1) {
      g.lineStyle(2, color, 1);
      g.strokeCircle(20, 22, 14);
      g.strokeCircle(40, 22, 14);
    }
  });
}

function buildStar(scene: Phaser.Scene) {
  makeTexture(scene, TX.star, 80, 80, g => {
    const cx = 40, cy = 40, R = 34, r = 15;
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * i) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? R : r;
      pts.push(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    g.fillStyle(COLORS.starYellow, 1);
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fillPath();
    g.lineStyle(3, COLORS.woodDark, 1);
    g.strokePath();
  });
}

function buildPanel(scene: Phaser.Scene) {
  makeTexture(scene, TX.panel, 560, 460, g => {
    g.fillStyle(COLORS.woodDark, 1);
    g.fillRoundedRect(0, 0, 560, 460, 28);
    g.fillStyle(COLORS.panelBg, 1);
    g.fillRoundedRect(12, 12, 536, 436, 22);
    g.lineStyle(6, COLORS.panelBorder, 1);
    g.strokeRoundedRect(12, 12, 536, 436, 22);
  });
}

function buildButton(scene: Phaser.Scene, key: string, top: number, shadow: number) {
  makeTexture(scene, key, 360, 100, g => {
    g.fillStyle(shadow, 1);
    g.fillRoundedRect(0, 8, 360, 92, 22);
    g.fillStyle(top, 1);
    g.fillRoundedRect(0, 0, 360, 84, 22);
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(16, 8, 328, 24, 12);
  });
}

function buildConfetti(scene: Phaser.Scene) {
  makeTexture(scene, TX.confetti, 16, 16, g => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 16, 6);
  });
}

function buildPaw(scene: Phaser.Scene) {
  makeTexture(scene, TX.paw, 120, 120, g => {
    g.fillStyle(COLORS.raccoonBody, 1);
    g.fillCircle(60, 70, 34);
    g.fillCircle(22, 40, 14);
    g.fillCircle(48, 24, 14);
    g.fillCircle(74, 24, 14);
    g.fillCircle(100, 40, 14);
  });
}

function buildSoundIcon(scene: Phaser.Scene, key: string, on: boolean) {
  makeTexture(scene, key, 72, 72, g => {
    g.fillStyle(COLORS.textLight, 1);
    g.fillRect(10, 26, 16, 20);
    g.fillTriangle(26, 26, 26, 46, 46, 56);
    g.fillTriangle(26, 26, 46, 16, 46, 56);
    if (on) {
      g.lineStyle(4, COLORS.textLight, 1);
      g.beginPath(); g.arc(50, 36, 10, -Math.PI / 3, Math.PI / 3); g.strokePath();
      g.beginPath(); g.arc(50, 36, 18, -Math.PI / 3, Math.PI / 3); g.strokePath();
    } else {
      g.lineStyle(5, 0xff5252, 1);
      g.beginPath(); g.moveTo(46, 20); g.lineTo(66, 52); g.strokePath();
      g.beginPath(); g.moveTo(66, 20); g.lineTo(46, 52); g.strokePath();
    }
  });
}

function buildPauseIcon(scene: Phaser.Scene) {
  makeTexture(scene, TX.pause, 72, 72, g => {
    g.fillStyle(COLORS.textLight, 1);
    g.fillRoundedRect(18, 14, 14, 44, 4);
    g.fillRoundedRect(40, 14, 14, 44, 4);
  });
}
