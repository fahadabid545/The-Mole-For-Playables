import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Save } from '../services/SaveService';
import { FLAGS } from '../config/BuildFlags';
import { TX } from '../objects/TextureFactory';
import { Button } from '../ui/Button';
import { Audio } from '../services/AudioService';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';

export class LevelSelectScene extends Phaser.Scene {
  private gridContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private minY = 0;
  private maxY = 0;
  private dragging = false;
  private lastY = 0;

  constructor() { super('LevelSelect'); }

  create(): void {
    new ParallaxJungle(this);

    // Hanging signboard title — pushed below browser top-chrome
    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, I18n.t('levels'), TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    // Grid area clipped between title (bottom) and BACK button (top).
    // Extra top padding so the first row of tiles isn't chopped off by
    // the signboard.
    const topClip = 260;
    const bottomClip = 260;
    const clipH = GAME_HEIGHT - topClip - bottomClip;

    this.gridContainer = this.add.container(0, topClip);

    const save = Save.get();
    const cols = 5;
    const size = 110;
    const gap = 20;
    const totalW = cols * size + (cols - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + size / 2;
    const rowH = size + gap;

    for (let i = 0; i < FLAGS.totalLevels; i++) {
      const level = i + 1;
      const c = i % cols, r = Math.floor(i / cols);
      const x = startX + c * (size + gap);
      const y = 30 + r * rowH;
      const unlocked = level <= save.highestUnlockedLevel;

      // Wooden tile background (with locked variant showing leaf overlay).
      // Texture is 130x130; scale to fit `size` without distorting.
      const tileKey = unlocked ? TX.tileWood : TX.tileWoodLocked;
      const scale = size / 130;
      const tileImg = this.add.image(x, y, tileKey).setOrigin(0.5).setScale(scale);
      let numOrLock: Phaser.GameObjects.GameObject;
      if (unlocked) {
        numOrLock = this.add.text(x, y - 6, `${level}`, TS.hudBig('#fff5c9')).setOrigin(0.5);
      } else {
        numOrLock = this.add.image(x, y, TX.iconLock).setOrigin(0.5).setScale(0.85);
      }
      this.gridContainer.add([tileImg, numOrLock]);
      // Reassign name so pointer hookup below uses the image
      const tile = tileImg;

      const stars = save.perLevelStars[level] ?? 0;
      for (let s = 0; s < 3; s++) {
        const st = this.add.image(x - 24 + s * 24, y + 38, TX.star).setOrigin(0.5).setScale(0.28);
        if (s >= stars) st.setAlpha(0.3);
        this.gridContainer.add(st);
      }

      if (unlocked) {
        tile.setInteractive({ useHandCursor: true });
        let downX = 0, downY = 0;
        tile.on('pointerdown', (p: Phaser.Input.Pointer) => { downX = p.x; downY = p.y; });
        tile.on('pointerup', (p: Phaser.Input.Pointer) => {
          if (Math.hypot(p.x - downX, p.y - downY) > 10) return; // drag, not tap
          Audio.play('click');
          this.scene.start('Game', { level });
        });
      }
    }

    const rows = Math.ceil(FLAGS.totalLevels / cols);
    const contentH = 60 + rows * rowH;
    this.minY = Math.min(topClip, GAME_HEIGHT - bottomClip - contentH);
    this.maxY = topClip;

    // Rectangle mask so scrolled tiles are clipped inside the viewport.
    const maskShape = this.make.graphics({ x: 0, y: 0 }).fillStyle(0xffffff)
      .fillRect(0, topClip, GAME_WIDTH, clipH);
    const mask = maskShape.createGeometryMask();
    this.gridContainer.setMask(mask);

    // Scroll: pointer drag + mouse wheel
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y >= topClip && p.y <= topClip + clipH) { this.dragging = true; this.lastY = p.y; }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      const dy = p.y - this.lastY;
      this.lastY = p.y;
      this.scrollBy(dy);
    });
    this.input.on('pointerup', () => { this.dragging = false; });
    this.input.on('wheel', (_: unknown, __: unknown, ___: number, dy: number) => this.scrollBy(-dy));

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 220, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
  }

  private scrollBy(dy: number): void {
    this.scrollY += dy;
    // Clamp so grid doesn't fly out of view
    const targetY = Math.min(this.maxY, Math.max(this.minY, this.maxY + this.scrollY));
    this.scrollY = targetY - this.maxY;
    this.gridContainer.y = targetY;
  }
}
