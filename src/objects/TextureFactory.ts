import Phaser from 'phaser';
import { COLORS } from '../config/GameConfig';

// All textures are generated at runtime with Phaser.Graphics — no binary assets.
// Real art can later be dropped into public/assets and loaded in PreloadScene
// under the same texture keys; the game will pick those up automatically.

export const TX = {
  bgSky: 'tx-bg-sky',
  bgMountains: 'tx-bg-mountains',
  bgSunrays: 'tx-bg-sunrays',
  bgTreesFar: 'tx-bg-trees-far',
  bgTreesNear: 'tx-bg-trees-near',
  bgLeavesFg: 'tx-bg-leaves-fg',
  bgGround: 'tx-bg-ground',
  bgRiver: 'tx-bg-river',
  bgJungle: 'tx-bg-jungle',
  tileWood: 'tx-tile-wood',
  tileWoodLocked: 'tx-tile-wood-locked',
  hudBar: 'tx-hud-bar',
  signHang: 'tx-sign-hang',
  vine: 'tx-vine',
  leafParticle: 'tx-leaf-particle',
  logHole: 'tx-log-hole',
  logHoleShadow: 'tx-log-hole-shadow',
  raccoon: 'tx-raccoon',
  raccoonHit: 'tx-raccoon-hit',
  raccoonGolden: 'tx-raccoon-golden',
  raccoonFrozen: 'tx-raccoon-frozen',
  raccoonBoss: 'tx-raccoon-boss',
  bomb: 'tx-bomb',
  cat: 'tx-cat',
  goat: 'tx-goat',
  hammer: 'tx-hammer',
  spark: 'tx-spark',
  dust: 'tx-dust',
  heartFull: 'tx-heart-full',
  heartEmpty: 'tx-heart-empty',
  star: 'tx-star',
  panel: 'tx-panel',
  close: 'tx-close',
  button: 'tx-button',
  buttonPressed: 'tx-button-pressed',
  buttonAd: 'tx-button-ad',
  confetti: 'tx-confetti',
  paw: 'tx-paw',
  soundOn: 'tx-sound-on',
  soundOff: 'tx-sound-off',
  pause: 'tx-pause',
  iconLock: 'tx-icon-lock',
  iconFlame: 'tx-icon-flame',
  iconHeartIcon: 'tx-icon-heart',
  iconTrophy: 'tx-icon-trophy',
  iconGear: 'tx-icon-gear',
  iconFreeze: 'tx-icon-freeze',
  iconDouble: 'tx-icon-double',
  iconTarget: 'tx-icon-target',
  iconCheck: 'tx-icon-check',
  iconShield: 'tx-icon-shield',
  iconBolt: 'tx-icon-bolt',
  iconSwords: 'tx-icon-swords',
  iconCalendar: 'tx-icon-calendar',
  iconMedal: 'tx-icon-medal',
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
  buildMountains(scene);
  buildSunrays(scene);
  buildTreesFar(scene);
  buildTreesNear(scene);
  buildLeavesFg(scene);
  buildGround(scene);
  buildRiver(scene);
  buildTileWood(scene);
  buildTileWoodLocked(scene);
  buildHudBar(scene);
  buildSignHang(scene);
  buildVine(scene);
  buildLeafParticle(scene);
  buildLogHole(scene);
  buildLogHoleShadow(scene);
  buildRaccoon(scene, TX.raccoon, COLORS.raccoonBody, COLORS.raccoonFur, false);
  buildRaccoon(scene, TX.raccoonHit, COLORS.raccoonBody, COLORS.raccoonFur, true);
  buildRaccoon(scene, TX.raccoonGolden, COLORS.gold, 0xfff59d, false);
  buildRaccoon(scene, TX.raccoonFrozen, 0x81d4fa, 0xe1f5fe, false);
  buildBossRaccoon(scene);
  buildBomb(scene);
  buildCat(scene);
  buildGoat(scene);
  buildHammer(scene);
  buildSpark(scene);
  buildDust(scene);
  buildHeart(scene, TX.heartFull, COLORS.heart, 1);
  buildHeart(scene, TX.heartEmpty, COLORS.heartEmpty, 0.35);
  buildStar(scene);
  buildPanel(scene);
  buildCloseButton(scene);
  buildButton(scene, TX.button, COLORS.wood, COLORS.woodDark);
  buildButton(scene, TX.buttonPressed, COLORS.woodDark, 0x3a2410);
  buildButton(scene, TX.buttonAd, 0xff9a1f, 0xc65a00);
  buildConfetti(scene);
  buildPaw(scene);
  buildSoundIcon(scene, TX.soundOn, true);
  buildSoundIcon(scene, TX.soundOff, false);
  buildPauseIcon(scene);
  buildIconLock(scene);
  buildIconFlame(scene);
  buildIconHeart(scene);
  buildIconTrophy(scene);
  buildIconGear(scene);
  buildIconFreeze(scene);
  buildIconDouble(scene);
  buildIconTarget(scene);
  buildIconCheck(scene);
  buildIconShield(scene);
  buildIconBolt(scene);
  buildIconSwords(scene);
  buildIconCalendar(scene);
  buildIconMedal(scene);
}

// ----- individual builders -----

function buildSky(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgSky, 720, 1280, g => {
    // Solid stripe gradient (fillGradientStyle unreliable in generateTexture)
    // — paint short horizontal bands to fake a smooth vertical gradient.
    const bands = 64;
    const bandH = 1280 / bands;
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
    const mix = (c1: number, c2: number, t: number) => {
      const r = lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t);
      const g_ = lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t);
      const b = lerp(c1 & 255, c2 & 255, t);
      return (r << 16) | (g_ << 8) | b;
    };
    for (let i = 0; i < bands; i++) {
      const y = i * bandH;
      const t = i / (bands - 1);
      // Top→Mid for upper 60%, Mid→Bottom for lower 40%
      const col = t < 0.6
        ? mix(COLORS.skyTop, COLORS.skyMid, t / 0.6)
        : mix(COLORS.skyMid, COLORS.skyBottom, (t - 0.6) / 0.4);
      g.fillStyle(col, 1);
      g.fillRect(0, y, 720, Math.ceil(bandH) + 1);
    }
    // Warm sun glow behind clouds
    g.fillStyle(0xfff59d, 0.55);
    g.fillCircle(560, 200, 120);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(560, 200, 68);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(560, 200, 40);
    // Fluffy clouds (soft, layered)
    for (let i = 0; i < 5; i++) {
      const x = 80 + i * 130;
      const y = 100 + (i % 2) * 60;
      g.fillStyle(0xffffff, 0.35);
      g.fillEllipse(x, y + 4, 160, 54);
      g.fillEllipse(x - 40, y + 12, 100, 38);
      g.fillEllipse(x + 40, y + 12, 100, 38);
      g.fillStyle(0xffffff, 0.75);
      g.fillEllipse(x, y, 130, 40);
      g.fillEllipse(x - 30, y + 8, 82, 30);
      g.fillEllipse(x + 30, y + 8, 82, 30);
    }
    // Distant tiny birds
    g.lineStyle(3, 0x2b1810, 0.4);
    for (let i = 0; i < 4; i++) {
      const bx = 180 + i * 90, by = 260 + (i % 2) * 30;
      g.beginPath();
      g.moveTo(bx, by); g.lineTo(bx + 8, by - 6); g.lineTo(bx + 16, by);
      g.moveTo(bx + 16, by); g.lineTo(bx + 24, by - 6); g.lineTo(bx + 32, by);
      g.strokePath();
    }
  });
}

function buildMountains(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgMountains, 720, 340, g => {
    // Far hazy ridge
    g.fillStyle(COLORS.mountainFar, 0.8);
    g.beginPath();
    g.moveTo(0, 340);
    g.lineTo(0, 220);
    const farPts = [[80, 160], [180, 200], [280, 130], [380, 180], [500, 120], [620, 180], [720, 150]];
    farPts.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(720, 340); g.closePath(); g.fillPath();
    // Snow caps on far peaks
    g.fillStyle(0xffffff, 0.55);
    g.fillTriangle(280, 130, 260, 168, 300, 168);
    g.fillTriangle(500, 120, 480, 160, 520, 160);
    // Nearer ridge
    g.fillStyle(COLORS.mountainNear, 0.9);
    g.beginPath();
    g.moveTo(0, 340);
    g.lineTo(0, 260);
    const nearPts = [[100, 220], [220, 260], [340, 200], [460, 250], [580, 210], [720, 250]];
    nearPts.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(720, 340); g.closePath(); g.fillPath();
    // Mist band
    g.fillStyle(0xffffff, 0.28);
    g.fillRect(0, 260, 720, 40);
  });
}

function buildSunrays(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgSunrays, 720, 1280, g => {
    // Radial soft yellow rays from top-right sun position
    const cx = 560, cy = 200;
    g.fillStyle(0xfff59d, 0.14);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const dx = Math.cos(a) * 900, dy = Math.sin(a) * 900;
      g.fillTriangle(cx, cy,
        cx + dx - Math.sin(a) * 30, cy + dy + Math.cos(a) * 30,
        cx + dx + Math.sin(a) * 30, cy + dy - Math.cos(a) * 30);
    }
    // Two big vertical shafts angling down-left
    g.fillStyle(0xfff8c9, 0.10);
    g.fillTriangle(cx, cy, cx - 380, 1280, cx - 250, 1280);
    g.fillTriangle(cx, cy, cx - 180, 1280, cx - 40, 1280);
  });
}

function buildTreesFar(scene: Phaser.Scene) {
  // Distant silhouettes — rolling hills of foliage at horizon only
  makeTexture(scene, TX.bgTreesFar, 720, 420, g => {
    // Row 1: hazy blue-green tree line
    g.fillStyle(COLORS.leafMid, 0.5);
    for (let x = -40; x < 760; x += 70) {
      const h = 140 + Math.sin(x * 0.03) * 40;
      g.fillCircle(x, 380, h * 0.4);
    }
    g.fillStyle(COLORS.leafMid, 0.5);
    g.fillRect(0, 380, 720, 40);
    // Row 2: closer, darker
    g.fillStyle(COLORS.leafDark, 0.75);
    for (let x = -20; x < 760; x += 90) {
      const h = 170 + Math.cos(x * 0.025) * 50;
      g.fillCircle(x, 400, h * 0.42);
    }
    g.fillRect(0, 400, 720, 20);
  });
}

function buildTreesNear(scene: Phaser.Scene) {
  // Left and right tree columns — canopy + trunks that only reach the
  // upper 700px, so ground/UI beneath stays clean (no trunks poking down).
  const TX_H = 700;
  makeTexture(scene, TX.bgTreesNear, 720, TX_H, g => {
    // ---- Left trunk (curved) ----
    const drawTrunk = (baseX: number, dir: number) => {
      // Trunk with slight organic curve
      for (let y = 0; y < TX_H; y += 8) {
        const w = 74 + Math.sin(y * 0.008) * 6;
        const x = baseX + Math.sin(y * 0.004 + dir) * 12 * dir;
        // Base wood
        g.fillStyle(COLORS.wood, 1);
        g.fillRect(x - w / 2, y, w, 10);
        // Grain highlight
        g.fillStyle(COLORS.woodLight, 0.35);
        g.fillRect(x - w / 2 + 8, y, 10, 10);
        // Deep shadow edge
        g.fillStyle(COLORS.woodDark, 0.55);
        g.fillRect(x + w / 2 - 12, y, 12, 10);
      }
      // Bark knots
      g.fillStyle(COLORS.woodDark, 0.7);
      for (let y = 200; y < TX_H - 80; y += 220) g.fillEllipse(baseX + dir * 8, y, 22, 12);
    };
    drawTrunk(50, 1);
    drawTrunk(670, -1);

    // ---- Canopy top clumps (overhang from top edge) ----
    const clump = (cx: number, cy: number, r: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy, r);
      g.fillCircle(cx - r * 0.6, cy + r * 0.2, r * 0.8);
      g.fillCircle(cx + r * 0.6, cy + r * 0.2, r * 0.8);
      g.fillCircle(cx, cy - r * 0.3, r * 0.75);
    };
    // Left canopy
    clump(0, 0, 190, COLORS.leafDark);
    clump(80, 60, 160, COLORS.leafMid);
    clump(140, 30, 100, COLORS.leafLight, 0.9);
    // Right canopy
    clump(720, 0, 190, COLORS.leafDark);
    clump(640, 60, 160, COLORS.leafMid);
    clump(580, 30, 100, COLORS.leafLight, 0.9);
    // Center-top overhang (smaller, gives lush frame)
    clump(360, -30, 150, COLORS.leafDark, 0.9);
    clump(280, 30, 90, COLORS.leafMid, 0.85);
    clump(440, 30, 90, COLORS.leafMid, 0.85);

    // ---- Hanging vines (thin, subtle, from top only) ----
    g.lineStyle(4, COLORS.leafDark, 0.85);
    const vine = (x0: number, wobble: number, len: number) => {
      g.beginPath();
      g.moveTo(x0, 0);
      for (let y = 0; y < len; y += 12) g.lineTo(x0 + Math.sin(y * 0.06 + wobble) * 14, y);
      g.strokePath();
    };
    vine(90, 0, 340);
    vine(130, 1, 260);
    vine(590, 0.5, 300);
    vine(640, 1.5, 260);
    // Little leaves on vines
    g.fillStyle(COLORS.leafMid, 0.9);
    for (const [x, y] of [[92, 120], [96, 240], [128, 180], [592, 140], [594, 230], [640, 200]] as const) {
      g.fillEllipse(x - 12, y, 20, 10);
      g.fillEllipse(x + 12, y + 20, 20, 10);
    }
  });
}

function buildLeavesFg(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgLeavesFg, 720, 260, g => {
    g.fillStyle(COLORS.leafDark, 1);
    for (let x = -40; x < 760; x += 60) {
      const y = 40 + (x % 120) * 0.5;
      g.fillEllipse(x, y, 100, 66);
    }
    g.fillStyle(COLORS.leafMid, 0.95);
    for (let x = -20; x < 760; x += 60) {
      g.fillEllipse(x, 90 + (x % 100) * 0.4, 110, 72);
    }
    // Light-catch highlights
    g.fillStyle(COLORS.leafLight, 0.55);
    for (let x = 0; x < 720; x += 90) {
      g.fillEllipse(x, 40 + (x % 80) * 0.3, 44, 22);
    }
  });
}

function buildGround(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgGround, 720, 900, g => {
    // Solid base green (gradient inside generateTexture is unreliable —
    // paint a solid fill then stripe-shade downward for the depth effect).
    g.fillStyle(0x8fc16e, 1);
    g.fillRect(0, 0, 720, 900);
    // Downward shading stripes so it looks like it recedes
    for (let y = 0; y < 900; y += 4) {
      const t = y / 900;
      const shadeAlpha = t * 0.35;
      g.fillStyle(0x2e5920, shadeAlpha);
      g.fillRect(0, y, 720, 4);
    }
    // Soft curved top edge (grassy horizon)
    g.fillStyle(0x9ac970, 1);
    for (let x = 0; x < 720; x += 8) {
      const w = Math.sin(x * 0.02) * 6 + 4;
      g.fillEllipse(x, 0, 12, 8 + w);
    }
    // Soft dappled shadow patches
    g.fillStyle(0x1f5a2b, 0.22);
    g.fillEllipse(200, 360, 320, 140);
    g.fillEllipse(560, 480, 340, 150);
    g.fillEllipse(360, 220, 500, 120);
    // Sun dapples
    g.fillStyle(0xd6f5b3, 0.35);
    g.fillEllipse(140, 240, 200, 80);
    g.fillEllipse(500, 180, 240, 70);
    g.fillEllipse(380, 620, 300, 90);
    // Grass tufts
    for (let i = 0; i < 50; i++) {
      const x = 20 + Math.floor((i * 97) % 680);
      const y = 40 + Math.floor((i * 61) % 820);
      g.fillStyle(0x6ba444, 1);
      g.fillTriangle(x, y, x + 4, y - 12, x + 8, y);
      g.fillTriangle(x - 6, y + 2, x - 2, y - 10, x + 2, y + 2);
      g.fillStyle(0xbfe093, 0.9);
      g.fillTriangle(x + 2, y - 2, x + 4, y - 10, x + 6, y - 2);
    }
    // Small flowers (subtle pops of color)
    const flower = (fx: number, fy: number, col: number) => {
      g.fillStyle(col, 1);
      g.fillCircle(fx - 4, fy, 3);
      g.fillCircle(fx + 4, fy, 3);
      g.fillCircle(fx, fy - 4, 3);
      g.fillCircle(fx, fy + 4, 3);
      g.fillStyle(0xffeb3b, 1); g.fillCircle(fx, fy, 3);
    };
    flower(90, 180, 0xf8bbd0); flower(620, 260, 0xff8a80);
    flower(440, 500, 0xce93d8); flower(180, 640, 0xffab91);
    flower(560, 720, 0xf48fb1);
    // Pebbles
    g.fillStyle(0x9c8778, 1);
    for (let i = 0; i < 12; i++) {
      const x = 40 + (i * 89) % 640;
      const y = 90 + (i * 73) % 780;
      g.fillEllipse(x, y, 16, 9);
      g.fillStyle(0xd7c9b7, 0.5); g.fillEllipse(x - 3, y - 2, 6, 3);
      g.fillStyle(0x9c8778, 1);
    }
  });
}

function buildRiver(scene: Phaser.Scene) {
  makeTexture(scene, TX.bgRiver, 720, 140, g => {
    // Water gradient
    g.fillGradientStyle(COLORS.water, COLORS.water, COLORS.waterDark, COLORS.waterDark, 1);
    g.fillRoundedRect(-20, 0, 760, 140, 40);
    // Foam ripples
    g.fillStyle(COLORS.waterFoam, 0.9);
    for (let x = 0; x < 720; x += 60) {
      g.fillEllipse(x, 20, 40, 8);
      g.fillEllipse(x + 30, 60, 30, 6);
      g.fillEllipse(x, 100, 44, 8);
    }
    // Highlight sheen
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(180, 40, 120, 10);
    g.fillEllipse(520, 90, 140, 12);
  });
}

function buildVine(scene: Phaser.Scene) {
  makeTexture(scene, TX.vine, 60, 500, g => {
    // Vine stem — twisting curve
    g.fillStyle(COLORS.leafDark, 1);
    for (let y = 0; y < 500; y += 4) {
      const x = 30 + Math.sin(y * 0.03) * 10;
      g.fillCircle(x, y, 6);
    }
    // Leaves along the vine
    g.fillStyle(COLORS.leafMid, 1);
    for (let y = 30; y < 500; y += 55) {
      const x = 30 + Math.sin(y * 0.03) * 10;
      g.fillEllipse(x - 18, y, 24, 12);
      g.fillEllipse(x + 18, y + 20, 24, 12);
    }
    g.fillStyle(COLORS.leafLight, 0.8);
    for (let y = 30; y < 500; y += 55) {
      const x = 30 + Math.sin(y * 0.03) * 10;
      g.fillEllipse(x - 18, y - 2, 14, 6);
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
  makeTexture(scene, TX.logHole, r * 2 + 30, r * 2 + 80, g => {
    const cx = r + 15, cy = r + 20;
    // Grass mound base (dirt bump around the hole)
    g.fillStyle(0x6ba444, 1);
    g.fillEllipse(cx, cy + 40, r * 2.15, r * 1.35);
    // Mound highlight
    g.fillStyle(0x9ac970, 1);
    g.fillEllipse(cx, cy + 30, r * 2.0, r * 1.2);
    // Grass tufts around rim
    g.fillStyle(0x4a8b3a, 1);
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + (i / 7) * Math.PI;
      const px = cx + Math.cos(a) * (r + 8);
      const py = cy + Math.sin(a) * (r * 0.6) + 6;
      g.fillTriangle(px - 5, py, px, py - 12, px + 5, py);
    }
    // Dirt rim (front)
    g.fillStyle(COLORS.woodLight, 1);
    g.fillEllipse(cx, cy + 12, r * 2, r * 1.3);
    g.fillStyle(COLORS.wood, 1);
    g.fillEllipse(cx, cy + 6, r * 2 - 14, r * 1.2);
    g.fillStyle(COLORS.woodDark, 1);
    g.fillEllipse(cx, cy, r * 2 - 26, r * 1.1);
    // Inner dark hole
    g.fillStyle(0x1a0f08, 1);
    g.fillEllipse(cx, cy, r * 1.6, r * 0.9);
    // Deeper inner shadow
    g.fillStyle(0x000000, 0.85);
    g.fillEllipse(cx, cy - 4, r * 1.35, r * 0.72);
    // Rim highlight (top-left catches light)
    g.fillStyle(0xffffff, 0.15);
    g.fillEllipse(cx - 30, cy - r * 0.5, r * 1.2, 14);
  });
}

function buildLogHoleShadow(scene: Phaser.Scene) {
  makeTexture(scene, TX.logHoleShadow, 240, 60, g => {
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(120, 30, 220, 40);
  });
}

function buildRaccoon(scene: Phaser.Scene, key: string, bodyColor: number, furColor: number, dizzy: boolean) {
  makeTexture(scene, key, 200, 200, g => {
    // Drop shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(100, 175, 130, 20);
    // Body (rounder mole)
    g.fillStyle(bodyColor, 1);
    g.fillEllipse(100, 120, 150, 130);
    // Body shading (bottom darker)
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(100, 155, 130, 40);
    // Belly (lighter cream)
    g.fillStyle(furColor, 1);
    g.fillEllipse(100, 140, 92, 74);
    // Head
    g.fillStyle(bodyColor, 1);
    g.fillEllipse(100, 78, 130, 108);
    // Head shading
    g.fillStyle(0x000000, 0.10);
    g.fillEllipse(100, 108, 118, 30);
    // Ears (rounder, less pointy)
    g.fillStyle(bodyColor, 1);
    g.fillCircle(45, 42, 22);
    g.fillCircle(155, 42, 22);
    g.fillStyle(0x000000, 0.35);
    g.fillCircle(45, 46, 14);
    g.fillCircle(155, 46, 14);
    g.fillStyle(COLORS.raccoonNose, 0.85);
    g.fillCircle(45, 44, 10);
    g.fillCircle(155, 44, 10);
    // Cheek blush (cuteness)
    g.fillStyle(0xff8a80, 0.55);
    g.fillEllipse(52, 96, 22, 12);
    g.fillEllipse(148, 96, 22, 12);
    // Mask around eyes
    g.fillStyle(COLORS.raccoonMask, 1);
    g.fillEllipse(72, 76, 44, 30);
    g.fillEllipse(128, 76, 44, 30);
    // Snout / muzzle (light)
    g.fillStyle(0xfff5c9, 1);
    g.fillEllipse(100, 102, 54, 32);
    // Nose (heart-like triangle)
    g.fillStyle(COLORS.raccoonNose, 1);
    g.fillTriangle(90, 88, 110, 88, 100, 100);
    g.fillCircle(100, 89, 6);
    // Eyes
    if (dizzy) {
      g.lineStyle(4, 0xffffff, 1);
      g.strokeCircle(72, 76, 11);
      g.strokeCircle(128, 76, 11);
      g.lineStyle(3, 0xffffff, 1);
      g.beginPath(); g.moveTo(64, 68); g.lineTo(80, 84); g.moveTo(80, 68); g.lineTo(64, 84); g.strokePath();
      g.beginPath(); g.moveTo(120, 68); g.lineTo(136, 84); g.moveTo(136, 68); g.lineTo(120, 84); g.strokePath();
    } else {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(72, 76, 10);
      g.fillCircle(128, 76, 10);
      g.fillStyle(0x1a0f08, 1);
      g.fillCircle(74, 78, 7);
      g.fillCircle(130, 78, 7);
      // Eye shine
      g.fillStyle(0xffffff, 1);
      g.fillCircle(76, 76, 2.5);
      g.fillCircle(132, 76, 2.5);
    }
    // Smile
    g.lineStyle(3, COLORS.raccoonMask, 1);
    g.beginPath();
    g.moveTo(85, 112);
    g.lineTo(100, 120);
    g.lineTo(115, 112);
    g.strokePath();
    // Tiny front teeth (cute)
    g.fillStyle(0xffffff, 1);
    g.fillRect(95, 118, 4, 5);
    g.fillRect(101, 118, 4, 5);
    // Tiny paws in front
    g.fillStyle(furColor, 1);
    g.fillEllipse(56, 156, 28, 14);
    g.fillEllipse(144, 156, 28, 14);
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

function buildCat(scene: Phaser.Scene) {
  makeTexture(scene, TX.cat, 200, 220, g => {
    const body = 0xf5f5f5, shade = 0xd0d0d0, dark = 0x2b1810;
    g.fillStyle(shade, 1); g.fillEllipse(100, 168, 110, 40);
    g.fillStyle(body, 1); g.fillEllipse(100, 130, 120, 100);
    g.fillTriangle(46, 88, 66, 44, 82, 82);
    g.fillTriangle(154, 88, 134, 44, 118, 82);
    g.fillStyle(0xffb3ba, 1);
    g.fillTriangle(54, 82, 66, 56, 76, 78);
    g.fillTriangle(146, 82, 134, 56, 124, 78);
    g.fillStyle(0x66bb6a, 1); g.fillCircle(76, 122, 12); g.fillCircle(124, 122, 12);
    g.fillStyle(dark, 1); g.fillEllipse(76, 124, 6, 12); g.fillEllipse(124, 124, 6, 12);
    g.fillStyle(0xffb3ba, 1); g.fillTriangle(94, 142, 106, 142, 100, 152);
    g.lineStyle(3, dark, 1);
    g.beginPath(); g.moveTo(60, 138); g.lineTo(30, 132); g.strokePath();
    g.beginPath(); g.moveTo(60, 148); g.lineTo(28, 148); g.strokePath();
    g.beginPath(); g.moveTo(140, 138); g.lineTo(170, 132); g.strokePath();
    g.beginPath(); g.moveTo(140, 148); g.lineTo(172, 148); g.strokePath();
  });
}

function buildGoat(scene: Phaser.Scene) {
  makeTexture(scene, TX.goat, 200, 220, g => {
    const body = 0xf1e6cf, shade = 0xc9b48a, dark = 0x2b1810, horn = 0x8d6e63;
    g.fillStyle(shade, 1); g.fillEllipse(100, 172, 108, 34);
    g.fillStyle(body, 1); g.fillEllipse(100, 128, 118, 100);
    g.fillStyle(horn, 1);
    g.fillTriangle(60, 60, 78, 20, 74, 74);
    g.fillTriangle(140, 60, 122, 20, 126, 74);
    g.fillStyle(body, 1); g.fillEllipse(100, 148, 76, 60);
    g.fillStyle(dark, 1);
    g.fillCircle(80, 126, 7); g.fillCircle(120, 126, 7);
    g.fillEllipse(100, 158, 12, 6);
    g.fillStyle(shade, 1);
    g.fillTriangle(94, 176, 106, 176, 100, 196);
    g.fillStyle(body, 1);
    g.fillEllipse(72, 202, 22, 12); g.fillEllipse(128, 202, 22, 12);
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
  // Burning heart — heart shape topped with a flickering flame.
  // Empty variant (alpha < 1) draws outline only + faint charred flame.
  makeTexture(scene, key, 72, 88, g => {
    // Flame (drawn first so heart overlaps its base a bit)
    if (alpha >= 1) {
      // Outer orange flame
      g.fillStyle(0xff6f00, 1);
      g.beginPath();
      g.moveTo(36, 0);
      g.lineTo(52, 18);
      g.lineTo(48, 30);
      g.lineTo(56, 40);
      g.lineTo(36, 44);
      g.lineTo(16, 40);
      g.lineTo(24, 30);
      g.lineTo(20, 18);
      g.closePath(); g.fillPath();
      // Inner yellow tongue
      g.fillStyle(0xffd54f, 1);
      g.beginPath();
      g.moveTo(36, 8);
      g.lineTo(46, 22);
      g.lineTo(42, 32);
      g.lineTo(36, 38);
      g.lineTo(30, 32);
      g.lineTo(26, 22);
      g.closePath(); g.fillPath();
      // White hot core
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(36, 30, 8, 12);
    } else {
      // Charred faint flame outline for empty slots
      g.lineStyle(2, 0x616161, 0.7);
      g.beginPath();
      g.moveTo(36, 8); g.lineTo(48, 22); g.lineTo(44, 32);
      g.lineTo(36, 40); g.lineTo(28, 32); g.lineTo(24, 22);
      g.closePath(); g.strokePath();
    }
    // Heart shape (bottom half of the texture)
    g.fillStyle(color, alpha);
    g.fillCircle(24, 52, 16);
    g.fillCircle(48, 52, 16);
    g.fillTriangle(8, 56, 64, 56, 36, 84);
    if (alpha < 1) {
      g.lineStyle(3, color, 1);
      g.strokeCircle(24, 52, 16);
      g.strokeCircle(48, 52, 16);
    } else {
      // Highlight glint on the heart
      g.fillStyle(0xffffff, 0.4);
      g.fillEllipse(20, 46, 10, 6);
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
  // Wooden signboard-style popup with rope hangs on top corners
  const W = 620, H = 780;
  makeTexture(scene, TX.panel, W, H, g => {
    // Ropes hanging from top-corners into the board
    g.lineStyle(8, COLORS.ropeShadow, 1);
    g.beginPath(); g.moveTo(100, 0); g.lineTo(80, 46); g.strokePath();
    g.beginPath(); g.moveTo(W - 100, 0); g.lineTo(W - 80, 46); g.strokePath();
    g.lineStyle(6, COLORS.rope, 1);
    g.beginPath(); g.moveTo(100, 0); g.lineTo(80, 46); g.strokePath();
    g.beginPath(); g.moveTo(W - 100, 0); g.lineTo(W - 80, 46); g.strokePath();
    // Deep drop-shadow behind board
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(12, 52, W - 24, H - 62, 36);
    // Dark wood frame (edge)
    g.fillStyle(COLORS.woodDark, 1);
    g.fillRoundedRect(4, 42, W - 8, H - 52, 34);
    // Main wood face (rich brown)
    g.fillStyle(COLORS.wood, 1);
    g.fillRoundedRect(14, 52, W - 28, H - 72, 28);
    // Inner cream carved panel
    g.fillStyle(COLORS.woodDark, 1);
    g.fillRoundedRect(28, 66, W - 56, H - 100, 22);
    g.fillGradientStyle(0xfff5c9, 0xfff5c9, 0xffe4a3, 0xffe4a3, 1);
    g.fillRoundedRect(34, 72, W - 68, H - 112, 18);
    // Top highlight strip on cream
    g.fillStyle(0xffffff, 0.5);
    g.fillRoundedRect(46, 82, W - 92, 18, 9);
    // Iron nails at 4 corners of wood frame
    const nail = (nx: number, ny: number) => {
      g.fillStyle(0x000000, 0.5); g.fillCircle(nx + 1, ny + 1, 8);
      g.fillStyle(0x666666, 1);   g.fillCircle(nx, ny, 7);
      g.fillStyle(0xd7d7d7, 1);   g.fillCircle(nx - 2, ny - 2, 3);
    };
    nail(32, 70); nail(W - 32, 70);
    nail(32, H - 42); nail(W - 32, H - 42);
    // Palm leaf accents at top corners
    g.fillStyle(COLORS.leafDark, 1);
    g.fillEllipse(70, 50, 60, 24);
    g.fillEllipse(W - 70, 50, 60, 24);
    g.fillStyle(COLORS.leafMid, 1);
    g.fillEllipse(72, 46, 46, 18);
    g.fillEllipse(W - 72, 46, 46, 18);
    g.fillStyle(COLORS.leafLight, 0.85);
    g.fillEllipse(78, 42, 30, 12);
    g.fillEllipse(W - 78, 42, 30, 12);
  });
}

function buildSignHang(scene: Phaser.Scene) {
  // Title signboard used for scene titles. Wide enough to hold longer
  // words like "Achievements" without the text spilling off the plank.
  const W = 540, H = 120;
  makeTexture(scene, TX.signHang, W, H + 20, g => {
    g.lineStyle(5, COLORS.ropeShadow, 1);
    g.beginPath(); g.moveTo(60, 0); g.lineTo(48, 22); g.strokePath();
    g.beginPath(); g.moveTo(W - 60, 0); g.lineTo(W - 48, 22); g.strokePath();
    g.lineStyle(3, COLORS.rope, 1);
    g.beginPath(); g.moveTo(60, 0); g.lineTo(48, 22); g.strokePath();
    g.beginPath(); g.moveTo(W - 60, 0); g.lineTo(W - 48, 22); g.strokePath();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(8, 28, W - 16, H, 20);
    g.fillStyle(COLORS.woodDark, 1); g.fillRoundedRect(4, 22, W - 8, H, 22);
    g.fillStyle(COLORS.wood, 1); g.fillRoundedRect(12, 30, W - 24, H - 16, 16);
    g.lineStyle(2, COLORS.woodGrain, 0.4);
    for (let y = 44; y < H + 10; y += 14) {
      g.beginPath(); g.moveTo(24, y + Math.sin(y * 0.1) * 2);
      g.lineTo(W - 24, y + Math.cos(y * 0.08) * 2); g.strokePath();
    }
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(24, 32, W - 48, 10, 5);
  });
}

function buildTileWood(scene: Phaser.Scene) {
  const S = 130;
  makeTexture(scene, TX.tileWood, S, S, g => {
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(6, 8, S - 8, S - 8, 18);
    g.fillStyle(COLORS.woodDark, 1); g.fillRoundedRect(0, 0, S, S - 6, 18);
    g.fillStyle(COLORS.wood, 1); g.fillRoundedRect(6, 6, S - 12, S - 18, 14);
    // Grain
    g.lineStyle(2, COLORS.woodGrain, 0.35);
    for (let y = 20; y < S - 20; y += 12) {
      g.beginPath(); g.moveTo(12, y + Math.sin(y * 0.1) * 2);
      g.lineTo(S - 12, y + Math.cos(y * 0.08) * 2); g.strokePath();
    }
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(14, 10, S - 28, 10, 5);
    // Corner nails
    const nail = (nx: number, ny: number) => {
      g.fillStyle(0x555, 1); g.fillCircle(nx, ny, 4);
      g.fillStyle(0xd7d7d7, 1); g.fillCircle(nx - 1, ny - 1, 1.5);
    };
    nail(14, 14); nail(S - 14, 14); nail(14, S - 20); nail(S - 14, S - 20);
  });
}

function buildTileWoodLocked(scene: Phaser.Scene) {
  const S = 130;
  makeTexture(scene, TX.tileWoodLocked, S, S, g => {
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(6, 8, S - 8, S - 8, 18);
    g.fillStyle(0x2a1810, 1); g.fillRoundedRect(0, 0, S, S - 6, 18);
    g.fillStyle(0x4a3020, 1); g.fillRoundedRect(6, 6, S - 12, S - 18, 14);
    // Vines covering (leaves)
    g.fillStyle(COLORS.leafDark, 0.9);
    g.fillEllipse(S / 2 - 24, 44, 40, 20);
    g.fillEllipse(S / 2 + 20, 60, 40, 20);
    g.fillEllipse(S / 2, S - 40, 44, 22);
    g.fillStyle(COLORS.leafMid, 0.8);
    g.fillEllipse(S / 2 - 20, 42, 26, 12);
    g.fillEllipse(S / 2 + 24, 58, 26, 12);
    g.fillEllipse(S / 2 + 4, S - 42, 30, 14);
  });
}

function buildHudBar(scene: Phaser.Scene) {
  // Wide wooden bar for HUD top area
  const W = 720, H = 180;
  makeTexture(scene, TX.hudBar, W, H, g => {
    // Ropes at top corners going into board (short)
    g.lineStyle(6, COLORS.ropeShadow, 1);
    g.beginPath(); g.moveTo(40, 0); g.lineTo(30, 22); g.strokePath();
    g.beginPath(); g.moveTo(W - 40, 0); g.lineTo(W - 30, 22); g.strokePath();
    g.lineStyle(4, COLORS.rope, 1);
    g.beginPath(); g.moveTo(40, 0); g.lineTo(30, 22); g.strokePath();
    g.beginPath(); g.moveTo(W - 40, 0); g.lineTo(W - 30, 22); g.strokePath();
    g.fillStyle(0x000000, 0.35); g.fillRect(0, 26, W, H - 26);
    g.fillStyle(COLORS.woodDark, 1); g.fillRoundedRect(-20, 18, W + 40, H - 26, 24);
    g.fillStyle(COLORS.wood, 1); g.fillRoundedRect(-14, 24, W + 28, H - 44, 20);
    g.lineStyle(2, COLORS.woodGrain, 0.35);
    for (let y = 42; y < H - 24; y += 14) {
      g.beginPath(); g.moveTo(0, y + Math.sin(y * 0.1) * 2);
      g.lineTo(W, y + Math.cos(y * 0.08) * 2); g.strokePath();
    }
    // Leaf accent left
    g.fillStyle(COLORS.leafDark, 1); g.fillEllipse(60, 22, 90, 34);
    g.fillStyle(COLORS.leafMid, 1);  g.fillEllipse(62, 20, 70, 26);
    g.fillStyle(COLORS.leafLight, 0.9); g.fillEllipse(68, 18, 46, 16);
    // Right
    g.fillStyle(COLORS.leafDark, 1); g.fillEllipse(W - 60, 22, 90, 34);
    g.fillStyle(COLORS.leafMid, 1);  g.fillEllipse(W - 62, 20, 70, 26);
    g.fillStyle(COLORS.leafLight, 0.9); g.fillEllipse(W - 68, 18, 46, 16);
  });
}

function buildCloseButton(scene: Phaser.Scene) {
  // Wooden round button with X carved into it
  makeTexture(scene, 'tx-close', 80, 80, g => {
    g.fillStyle(0x000000, 0.4); g.fillCircle(42, 44, 34);
    g.fillStyle(COLORS.woodDark, 1); g.fillCircle(40, 40, 34);
    g.fillStyle(COLORS.wood, 1); g.fillCircle(40, 40, 30);
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(34, 30, 24, 10);
    // Red X on top
    g.lineStyle(9, 0xd32f2f, 1);
    g.beginPath();
    g.moveTo(26, 26); g.lineTo(54, 54);
    g.moveTo(54, 26); g.lineTo(26, 54);
    g.strokePath();
    g.lineStyle(4, 0xffffff, 1);
    g.beginPath();
    g.moveTo(28, 28); g.lineTo(52, 52);
    g.moveTo(52, 28); g.lineTo(28, 52);
    g.strokePath();
  });
}

function buildButton(scene: Phaser.Scene, key: string, top: number, shadow: number) {
  // Wooden hanging plank with rope loops at top corners + iron nails.
  // Palette: `top` = plank main tone, `shadow` = darker lip beneath.
  const W = 420, H = 148;
  makeTexture(scene, key, W, H, g => {
    // Two ropes hanging from top-corners into the plank
    const ropeTop = 4, plankTop = 34;
    g.lineStyle(6, COLORS.ropeShadow, 1);
    g.beginPath(); g.moveTo(60, ropeTop); g.lineTo(50, plankTop + 8); g.strokePath();
    g.beginPath(); g.moveTo(W - 60, ropeTop); g.lineTo(W - 50, plankTop + 8); g.strokePath();
    g.lineStyle(4, COLORS.rope, 1);
    g.beginPath(); g.moveTo(60, ropeTop); g.lineTo(50, plankTop + 8); g.strokePath();
    g.beginPath(); g.moveTo(W - 60, ropeTop); g.lineTo(W - 50, plankTop + 8); g.strokePath();
    // Rope loops (small ovals at top)
    g.fillStyle(COLORS.rope, 1);
    g.fillEllipse(60, ropeTop + 2, 22, 10);
    g.fillEllipse(W - 60, ropeTop + 2, 22, 10);
    g.fillStyle(COLORS.ropeShadow, 1);
    g.fillEllipse(60, ropeTop + 2, 14, 6);
    g.fillEllipse(W - 60, ropeTop + 2, 14, 6);
    // Plank drop-shadow
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(14, plankTop + 8, W - 28, 106, 20);
    // Bottom lip (dark wood underside)
    g.fillStyle(shadow, 1);
    g.fillRoundedRect(8, plankTop + 6, W - 16, 104, 18);
    // Top plank face (main wood)
    g.fillStyle(top, 1);
    g.fillRoundedRect(8, plankTop, W - 16, 96, 18);
    // Wood grain lines (subtle)
    g.lineStyle(2, COLORS.woodGrain, 0.35);
    for (let y = plankTop + 18; y < plankTop + 88; y += 14) {
      g.beginPath();
      g.moveTo(24, y + Math.sin(y * 0.1) * 2);
      g.lineTo(W - 24, y + Math.cos(y * 0.08) * 2);
      g.strokePath();
    }
    // Board seam (two-plank illusion)
    g.lineStyle(2, COLORS.woodDark, 0.5);
    g.beginPath(); g.moveTo(24, plankTop + 48); g.lineTo(W - 24, plankTop + 48); g.strokePath();
    // Top rim highlight
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(20, plankTop + 4, W - 40, 12, 6);
    // Iron nails at corners
    const nail = (nx: number, ny: number) => {
      g.fillStyle(0x000000, 0.4); g.fillCircle(nx + 1, ny + 1, 6);
      g.fillStyle(0x555555, 1);   g.fillCircle(nx, ny, 5);
      g.fillStyle(0xd7d7d7, 1);   g.fillCircle(nx - 1, ny - 1, 2);
    };
    nail(28, plankTop + 14); nail(W - 28, plankTop + 14);
    nail(28, plankTop + 82); nail(W - 28, plankTop + 82);
    // Small leaf accent on left
    g.fillStyle(COLORS.leafDark, 1);
    g.fillEllipse(20, plankTop + 4, 22, 12);
    g.fillStyle(COLORS.leafMid, 1);
    g.fillEllipse(24, plankTop + 2, 16, 8);
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

function buildBossRaccoon(scene: Phaser.Scene) {
  makeTexture(scene, TX.raccoonBoss, 260, 260, g => {
    // Bigger body, purple-gold, spikes
    g.fillStyle(0x6a1b9a, 1);
    g.fillEllipse(130, 160, 200, 190);
    g.fillStyle(0x9c27b0, 1);
    g.fillEllipse(130, 90, 170, 140);
    // Crown
    g.fillStyle(COLORS.gold, 1);
    g.fillTriangle(70, 40, 100, 10, 130, 40);
    g.fillTriangle(100, 40, 130, 5, 160, 40);
    g.fillTriangle(130, 40, 160, 10, 190, 40);
    g.fillRect(70, 35, 120, 12);
    // Ears
    g.fillStyle(0x4a148c, 1);
    g.fillTriangle(70, 60, 60, 20, 100, 45);
    g.fillTriangle(190, 60, 200, 20, 160, 45);
    // Mask
    g.fillStyle(COLORS.raccoonMask, 1);
    g.fillEllipse(95, 100, 55, 32);
    g.fillEllipse(165, 100, 55, 32);
    // Eyes
    g.fillStyle(0xffee58, 1);
    g.fillCircle(95, 100, 10);
    g.fillCircle(165, 100, 10);
    g.fillStyle(0x000000, 1);
    g.fillCircle(97, 102, 6);
    g.fillCircle(167, 102, 6);
    // Snout + nose
    g.fillStyle(0xf5f5f5, 1);
    g.fillEllipse(130, 130, 60, 36);
    g.fillStyle(COLORS.raccoonNose, 1);
    g.fillEllipse(130, 118, 20, 14);
    // Fangs
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(118, 138, 122, 138, 120, 152);
    g.fillTriangle(138, 138, 142, 138, 140, 152);
  });
}

function buildIconLock(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconLock, 60, 72, g => {
    g.lineStyle(6, 0xffffff, 1);
    g.strokeRoundedRect(18, 8, 24, 26, 12);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(6, 30, 48, 38, 8);
    g.fillStyle(0x424242, 1);
    g.fillCircle(30, 46, 5);
    g.fillRect(28, 46, 4, 12);
  });
}

function buildIconFlame(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconFlame, 48, 60, g => {
    g.fillStyle(0xff6f00, 1);
    g.beginPath();
    g.moveTo(24, 6); g.lineTo(38, 24); g.lineTo(34, 34); g.lineTo(44, 42);
    g.lineTo(36, 54); g.lineTo(24, 58); g.lineTo(12, 54); g.lineTo(4, 42);
    g.lineTo(14, 34); g.lineTo(10, 24); g.closePath(); g.fillPath();
    g.fillStyle(0xffca28, 1);
    g.beginPath();
    g.moveTo(24, 20); g.lineTo(32, 34); g.lineTo(28, 42); g.lineTo(24, 48);
    g.lineTo(20, 42); g.lineTo(16, 34); g.closePath(); g.fillPath();
  });
}

function buildIconHeart(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconHeartIcon, 48, 44, g => {
    g.fillStyle(COLORS.heart, 1);
    g.fillCircle(16, 16, 12);
    g.fillCircle(32, 16, 12);
    g.fillTriangle(4, 20, 44, 20, 24, 42);
  });
}

function buildIconTrophy(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconTrophy, 64, 68, g => {
    g.fillStyle(COLORS.gold, 1);
    g.fillRoundedRect(16, 8, 32, 34, 6);
    // handles
    g.lineStyle(5, COLORS.gold, 1);
    g.strokeRoundedRect(4, 14, 12, 20, 6);
    g.strokeRoundedRect(48, 14, 12, 20, 6);
    // stem
    g.fillStyle(0x8d6e63, 1);
    g.fillRect(24, 42, 16, 12);
    // base
    g.fillStyle(0x6d4c41, 1);
    g.fillRoundedRect(14, 54, 36, 12, 4);
    // star on cup
    g.fillStyle(0xfff59d, 1);
    g.fillCircle(32, 24, 8);
  });
}

function buildIconGear(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconGear, 64, 64, g => {
    g.fillStyle(0xfffde7, 1);
    // 8 teeth
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const cx = 32 + Math.cos(a) * 26;
      const cy = 32 + Math.sin(a) * 26;
      g.fillCircle(cx, cy, 8);
    }
    g.fillCircle(32, 32, 22);
    g.fillStyle(0x424242, 1);
    g.fillCircle(32, 32, 8);
  });
}

function buildIconFreeze(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconFreeze, 60, 60, g => {
    g.lineStyle(6, 0x81d4fa, 1);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      const cx = 30, cy = 30, r = 24;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      g.beginPath(); g.moveTo(cx - dx, cy - dy); g.lineTo(cx + dx, cy + dy); g.strokePath();
    }
    // arrow tips
    g.fillStyle(0x0288d1, 1);
    g.fillCircle(30, 30, 6);
  });
}

function buildIconDouble(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconDouble, 68, 60, g => {
    g.fillStyle(0xffca28, 1);
    // x2 style: draw star + "2"
    const cx = 34, cy = 30, R = 22, r = 10;
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * i) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? R : r;
      pts.push(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fillPath();
    g.fillStyle(0x3e2723, 1);
    // "×2" label chunk
    g.fillRect(cx - 4, cy - 6, 2, 12);
    g.fillRect(cx + 2, cy - 6, 2, 12);
  });
}

function buildIconTarget(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconTarget, 60, 60, g => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(30, 30, 26);
    g.fillStyle(0xef5350, 1);
    g.fillCircle(30, 30, 20);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(30, 30, 14);
    g.fillStyle(0xef5350, 1);
    g.fillCircle(30, 30, 8);
    g.fillStyle(0x212121, 1);
    g.fillCircle(30, 30, 3);
  });
}

function buildIconCheck(scene: Phaser.Scene) {
  makeTexture(scene, TX.iconCheck, 44, 44, g => {
    g.fillStyle(0x2e7d32, 1);
    g.fillCircle(22, 22, 20);
    g.lineStyle(6, 0xffffff, 1);
    g.beginPath();
    g.moveTo(10, 22); g.lineTo(20, 32); g.lineTo(34, 14);
    g.strokePath();
  });
}

function buildIconShield(scene: Phaser.Scene) {
  // Untouchable / perfect — blue heraldic shield with a cross
  makeTexture(scene, TX.iconShield, 64, 68, g => {
    g.fillStyle(0x1976d2, 1);
    g.beginPath();
    g.moveTo(32, 4);
    g.lineTo(58, 14);
    g.lineTo(56, 40);
    g.lineTo(32, 64);
    g.lineTo(8, 40);
    g.lineTo(6, 14);
    g.closePath(); g.fillPath();
    // Inner lighter shield
    g.fillStyle(0x64b5f6, 1);
    g.beginPath();
    g.moveTo(32, 12); g.lineTo(50, 20);
    g.lineTo(48, 38); g.lineTo(32, 56);
    g.lineTo(16, 38); g.lineTo(14, 20);
    g.closePath(); g.fillPath();
    // White cross
    g.fillStyle(0xffffff, 1);
    g.fillRect(29, 20, 6, 26);
    g.fillRect(20, 30, 24, 6);
    // Rim shine
    g.fillStyle(0xffffff, 0.4);
    g.fillEllipse(24, 20, 12, 6);
  });
}

function buildIconBolt(scene: Phaser.Scene) {
  // Speed demon — yellow lightning bolt inside a dark circle
  makeTexture(scene, TX.iconBolt, 60, 68, g => {
    g.fillStyle(0x263238, 1); g.fillCircle(30, 34, 28);
    g.fillStyle(0xffd54f, 1);
    g.beginPath();
    g.moveTo(34, 8);
    g.lineTo(18, 34);
    g.lineTo(28, 34);
    g.lineTo(24, 60);
    g.lineTo(42, 30);
    g.lineTo(32, 30);
    g.lineTo(38, 8);
    g.closePath(); g.fillPath();
    // Bright inner streak
    g.fillStyle(0xffffff, 0.7);
    g.beginPath();
    g.moveTo(33, 14); g.lineTo(26, 30); g.lineTo(31, 30);
    g.lineTo(28, 44); g.lineTo(35, 32); g.lineTo(30, 32);
    g.lineTo(34, 14); g.closePath(); g.fillPath();
  });
}

function buildIconSwords(scene: Phaser.Scene) {
  // Boss slayer — two crossed swords over a dark disk
  makeTexture(scene, TX.iconSwords, 68, 68, g => {
    g.fillStyle(0x2b1810, 1); g.fillCircle(34, 34, 30);
    // First blade (top-left to bottom-right)
    const blade = (angle: number) => {
      const cx = 34, cy = 34;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const rot = (x: number, y: number) => [cx + x * cos - y * sin, cy + x * sin + y * cos] as const;
      // Blade rectangle
      const [a1, b1] = rot(-24, -3);
      const [a2, b2] = rot(20, -3);
      const [a3, b3] = rot(20, 3);
      const [a4, b4] = rot(-24, 3);
      g.fillStyle(0xd7d7d7, 1);
      g.fillPoints([{ x: a1, y: b1 }, { x: a2, y: b2 }, { x: a3, y: b3 }, { x: a4, y: b4 }], true);
      // Tip (triangle)
      const [t1, t2] = rot(28, 0);
      const [t3, t4] = rot(20, -5);
      const [t5, t6] = rot(20, 5);
      g.fillTriangle(t1, t2, t3, t4, t5, t6);
      // Hilt
      const [h1, h2] = rot(-24, -6);
      const [h3, h4] = rot(-18, -6);
      const [h5, h6] = rot(-18, 6);
      const [h7, h8] = rot(-24, 6);
      g.fillStyle(0x8b5a2b, 1);
      g.fillPoints([{ x: h1, y: h2 }, { x: h3, y: h4 }, { x: h5, y: h6 }, { x: h7, y: h8 }], true);
    };
    blade(Math.PI / 4);
    blade(-Math.PI / 4);
    // Center rivet
    g.fillStyle(0xffd54f, 1); g.fillCircle(34, 34, 4);
  });
}

function buildIconCalendar(scene: Phaser.Scene) {
  // Daily streak — calendar page with a "7" or checked square
  makeTexture(scene, TX.iconCalendar, 60, 64, g => {
    // Body
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(6, 12, 48, 46, 6);
    // Top red band
    g.fillStyle(0xe53935, 1); g.fillRoundedRect(6, 12, 48, 16, 6);
    g.fillRect(6, 20, 48, 8);
    // Two ring binders
    g.fillStyle(0x424242, 1);
    g.fillRoundedRect(16, 4, 4, 14, 2);
    g.fillRoundedRect(40, 4, 4, 14, 2);
    // Grid dots
    g.fillStyle(0xbdbdbd, 1);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.fillCircle(14 + c * 10, 34 + r * 8, 1.5);
    // Big "7" in bold
    g.fillStyle(0x2e7d32, 1);
    g.fillRect(20, 34, 20, 4);
    g.fillTriangle(40, 34, 40, 40, 30, 54);
    g.fillTriangle(30, 54, 34, 54, 40, 40);
  });
}

function buildIconMedal(scene: Phaser.Scene) {
  // Clean "1st place" coin — solid gold disk with a large "1" in the
  // center, no scalloped rim, no ribbon (previous designs read as an
  // "M" or a gear).
  makeTexture(scene, TX.iconMedal, 64, 64, g => {
    // Outer dark ring for depth
    g.fillStyle(0x8a5a00, 1); g.fillCircle(32, 32, 28);
    // Gold body
    g.fillStyle(COLORS.gold, 1); g.fillCircle(32, 32, 26);
    // Inner ring
    g.fillStyle(0xffb300, 1); g.fillCircle(32, 32, 22);
    // Bright face
    g.fillStyle(0xffe082, 1); g.fillCircle(32, 32, 18);
    // Big carved "1" in the middle
    g.fillStyle(0x8a5a00, 1);
    // Vertical stem
    g.fillRect(30, 20, 6, 26);
    // Top-left angled flag of the "1"
    g.fillTriangle(30, 20, 22, 26, 30, 26);
    // Bottom serif base
    g.fillRect(22, 46, 22, 4);
    // Highlight glint on top-left
    g.fillStyle(0xffffff, 0.55);
    g.fillEllipse(24, 22, 10, 4);
  });
}
