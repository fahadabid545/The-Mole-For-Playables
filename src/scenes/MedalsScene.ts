import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { ALL_MEDALS } from '../services/MedalService';
import { Audio } from '../services/AudioService';

export class MedalsScene extends Phaser.Scene {
  constructor() { super('Medals'); }

  create(): void {
    new ParallaxJungle(this);
    this.add.image(GAME_WIDTH / 2, 170, TX.signHang).setOrigin(0.5).setDepth(99).setScale(1.1);
    this.add.text(GAME_WIDTH / 2, 180, 'MEDALS', TS.title()).setOrigin(0.5).setDepth(100);

    const owned = new Set(Save.get().medals);
    const totalOwned = ALL_MEDALS.filter(m => owned.has(m.id)).length;
    this.add.text(GAME_WIDTH / 2, 300, `${totalOwned} / ${ALL_MEDALS.length} EARNED`,
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '26px',
        color: '#ffd54f', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);

    const topClip = 350;
    const bottomClip = 280;
    const clipH = GAME_HEIGHT - topClip - bottomClip;
    const container = this.add.container(0, topClip);

    const cols = 3;
    const size = 150;
    const gap = 24;
    const startX = (GAME_WIDTH - (cols * size + (cols - 1) * gap)) / 2 + size / 2;
    let selectedInfo: Phaser.GameObjects.Container | null = null;

    ALL_MEDALS.forEach((m, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = startX + c * (size + gap);
      const y = 20 + r * (size + gap + 40) + size / 2;
      const has = owned.has(m.id);

      // Wooden plaque behind each medal disc for the jungle look.
      const plaque = this.add.image(x, y, TX.tileWood).setOrigin(0.5)
        .setDisplaySize(size + 20, size + 20);
      if (!has) plaque.setTint(0x5d3a1a);
      const disc = this.add.circle(x, y, size / 2 - 6, has ? 0x8d6e63 : 0x1e120a, 0.95)
        .setStrokeStyle(5, has ? 0xffd54f : 0x5d3a1a);
      const icon = this.add.image(x, y - 6, TX.iconMedal).setOrigin(0.5).setScale(0.9);
      container.add(plaque);
      if (!has) icon.setAlpha(0.25);
      const label = this.add.text(x, y + size / 2 + 8, m.title,
        { fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '16px', color: has ? '#ffd54f' : '#8d6e63',
          align: 'center', wordWrap: { width: size + gap } }).setOrigin(0.5, 0);

      disc.setInteractive({ useHandCursor: true });
      disc.on('pointerdown', () => {
        Audio.play('click');
        if (selectedInfo) { selectedInfo.destroy(); selectedInfo = null; }
        selectedInfo = this.showInfo(m.title, m.how, has);
      });
      container.add([disc, icon, label]);
    });

    const rowsUsed = Math.ceil(ALL_MEDALS.length / cols);
    const contentH = 20 + rowsUsed * (size + gap + 40);
    const minY = Math.min(topClip, GAME_HEIGHT - bottomClip - contentH);
    const maxY = topClip;
    const mask = this.make.graphics({ x: 0, y: 0 }).fillStyle(0xffffff)
      .fillRect(0, topClip, GAME_WIDTH, clipH);
    container.setMask(mask.createGeometryMask());

    let scrollY = 0, dragging = false, lastY = 0;
    const scrollBy = (dy: number) => {
      scrollY += dy;
      const t = Math.min(maxY, Math.max(minY, maxY + scrollY));
      scrollY = t - maxY;
      container.y = t;
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y >= topClip && p.y <= topClip + clipH) { dragging = true; lastY = p.y; }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown) return;
      const dy = p.y - lastY; lastY = p.y; scrollBy(dy);
    });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('wheel', (_: unknown, __: unknown, ___: number, dy: number) => scrollBy(-dy));

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('JungleBoard'), scale: 0.8,
    });
    new AdBanner(this).show();
  }

  private showInfo(title: string, how: string, has: boolean): Phaser.GameObjects.Container {
    const c = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 320).setDepth(200);
    const bg = this.add.rectangle(0, 0, GAME_WIDTH - 60, 100, 0x2b1810, 0.95)
      .setStrokeStyle(4, has ? 0xffd54f : 0x8d6e63);
    const t = this.add.text(0, -20, title,
      { ...TS.panelTitle(has ? '#ffd54f' : '#fff5c9'), fontSize: '24px' }).setOrigin(0.5);
    const h = this.add.text(0, 22, how,
      { fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '18px',
        color: '#fff5c9', align: 'center', wordWrap: { width: GAME_WIDTH - 100 } }).setOrigin(0.5);
    c.add([bg, t, h]);
    this.tweens.add({ targets: c, alpha: { from: 0, to: 1 }, duration: 150 });
    return c;
  }
}
