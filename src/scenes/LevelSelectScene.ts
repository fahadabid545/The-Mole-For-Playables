import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Save } from '../services/SaveService';
import { FLAGS } from '../config/BuildFlags';
import { TX } from '../objects/TextureFactory';
import { Button } from '../ui/Button';
import { Audio } from '../services/AudioService';
import { AdBanner } from '../ui/AdBanner';
import { Ads } from '../services/AdsService';
import { EventBus, EVT } from '../utils/EventBus';
import { I18n } from '../services/I18nService';
import { OutOfLivesPopup } from '../ui/popups/OutOfLivesPopup';
import { allChallengesDone } from '../services/ChallengeService';
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

    this.add.image(GAME_WIDTH / 2, 160, TX.signHang).setOrigin(0.5, 0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 168, I18n.t('levels'), TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const topClip = 300;
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
      const y = 70 + r * rowH;
      const unlocked = level <= save.highestUnlockedLevel;

      const tileKey = unlocked ? TX.tileWood : TX.tileWoodLocked;
      const scale = size / 130;
      const tile = this.add.image(x, y, tileKey).setOrigin(0.5).setScale(scale);
      const numOrLock: Phaser.GameObjects.GameObject = unlocked
        ? this.add.text(x, y - 6, `${level}`, TS.hudBig('#fff5c9')).setOrigin(0.5)
        : this.add.image(x, y, TX.iconLock).setOrigin(0.5).setScale(0.85);
      this.gridContainer.add([tile, numOrLock]);

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
          if (Math.hypot(p.x - downX, p.y - downY) > 10) return;
          Audio.play('click');
          this.tryStartLevel(level);
        });
      }
    }

    const rows = Math.ceil(FLAGS.totalLevels / cols);
    const contentH = 60 + rows * rowH;
    this.minY = Math.min(topClip, GAME_HEIGHT - bottomClip - contentH);
    this.maxY = topClip;

    const maskShape = this.make.graphics({ x: 0, y: 0 }).fillStyle(0xffffff)
      .fillRect(0, topClip, GAME_WIDTH, clipH);
    this.gridContainer.setMask(maskShape.createGeometryMask());

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

  private tryStartLevel(level: number): void {
    Save.tryRegenLives(allChallengesDone());
    if (Save.get().lives > 0) {
      this.scene.start('Game', { level });
      return;
    }
    new OutOfLivesPopup(this, {
      onWatchAdForLife: async () => {
        const r = await Ads.showRewarded();
        if (r === 'reward') {
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
          this.scene.start('Game', { level });
        }
      },
      onChallenges: () => this.scene.start('Challenges'),
      onLivesRefilled: () => this.scene.start('Game', { level }),
      onMenu: () => this.scene.start('Menu'),
    });
  }

  private scrollBy(dy: number): void {
    this.scrollY += dy;
    const targetY = Math.min(this.maxY, Math.max(this.minY, this.maxY + this.scrollY));
    this.scrollY = targetY - this.maxY;
    this.gridContainer.y = targetY;
  }
}
