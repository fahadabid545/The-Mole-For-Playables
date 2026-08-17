import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TX, buildSkinPreview, buildSkinTextures } from '../objects/TextureFactory';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { CONSUMABLES, CONSUMABLE_KINDS, type ConsumableKind } from '../config/ConsumableConfig';
import { SKINS } from '../config/SkinConfig';
import { spawnScorePopup } from '../objects/ScorePopup';
import { fadeIn, fadeTo } from '../utils/SceneTransition';

type Tab = 'items' | 'skins';

export class ShopScene extends Phaser.Scene {
  private tab: Tab = 'items';

  constructor() { super('Shop'); }

  create(data?: { tab?: Tab }): void {
    this.tab = data?.tab ?? 'items';
    fadeIn(this);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const signBg = this.add.image(GAME_WIDTH / 2, 100, TX.signHang).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, signBg.y + 14, I18n.t('shop'), TS.title()).setOrigin(0.5);

    const coinIcon = this.add.image(30, 180, TX.coin).setOrigin(0, 0.5).setScale(0.9);
    this.add.text(coinIcon.x + 36, 180, `${Save.get().coins}`, TS.hudBig()).setOrigin(0, 0.5);

    const tabY = 222;
    const itemsTab = this.buildTab(GAME_WIDTH / 2 - 120, tabY, 'Items', this.tab === 'items');
    const skinsTab = this.buildTab(GAME_WIDTH / 2 + 120, tabY, 'Skins', this.tab === 'skins');

    itemsTab.on('pointerdown', () => {
      if (this.tab !== 'items') { Audio.play('click'); this.scene.restart({ tab: 'items' }); }
    });
    skinsTab.on('pointerdown', () => {
      if (this.tab !== 'skins') { Audio.play('click'); this.scene.restart({ tab: 'skins' }); }
    });

    if (this.tab === 'items') {
      this.buildItemsGrid();
    } else {
      this.buildSkinsGrid();
    }

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 100, {
      label: I18n.t('back'),
      onClick: () => fadeTo(this, 'Menu'),
    });
  }

  private buildTab(x: number, y: number, label: string, active: boolean): Phaser.GameObjects.Rectangle {
    const bg = this.add.rectangle(x, y, 200, 44, active ? 0x5d4037 : 0x3e2723, active ? 1 : 0.7)
      .setStrokeStyle(2, active ? 0xffb300 : 0x8d6e63)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '24px',
        color: active ? '#ffe082' : '#8d6e63' }).setOrigin(0.5);
    return bg;
  }

  private buildItemsGrid(): void {
    const cols = 2;
    const cardW = 300;
    const cardH = 100;
    const gapX = 20;
    const gapY = 16;
    const startY = 270;
    const startX = (GAME_WIDTH - cols * cardW - (cols - 1) * gapX) / 2;

    const coinText = this.children.list.find(
      c => c instanceof Phaser.GameObjects.Text && (c as Phaser.GameObjects.Text).text === `${Save.get().coins}`
    ) as Phaser.GameObjects.Text | undefined;

    const kinds = CONSUMABLE_KINDS;

    kinds.forEach((kind, i) => {
      const def = CONSUMABLES[kind];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX) + cardW / 2;
      const cy = startY + row * (cardH + gapY) + cardH / 2;

      const card = this.add.container(cx, cy);

      const bg = this.add.rectangle(0, 0, cardW, cardH, 0x3e2723, 0.85)
        .setStrokeStyle(2, 0x8d6e63);
      const icon = this.add.image(-cardW / 2 + 40, 0, (TX as any)[def.icon] || TX.iconTarget)
        .setOrigin(0.5).setScale(0.8);
      const name = this.add.text(-cardW / 2 + 72, -18, def.name,
        { fontFamily: 'Luckiest Guy, Impact, sans-serif', fontSize: '20px', color: '#ffe082' });
      const desc = this.add.text(-cardW / 2 + 72, 6, def.desc,
        { fontFamily: 'sans-serif', fontSize: '14px', color: '#bcaaa4', wordWrap: { width: cardW - 130 } });
      const count = Save.getConsumableCount(kind);
      const ownedText = this.add.text(cardW / 2 - 14, -30, `x${count}`,
        { fontFamily: 'Impact, sans-serif', fontSize: '18px', color: '#a5d6a7' }).setOrigin(1, 0);

      const buyBg = this.add.rectangle(cardW / 2 - 50, 24, 70, 30, 0xf9a825, 1).setStrokeStyle(2, 0xc68400);
      const buyLabel = this.add.text(cardW / 2 - 50, 24, `${def.cost}`,
        { fontFamily: 'Impact, sans-serif', fontSize: '18px', color: '#3e2723' }).setOrigin(0.5);

      buyBg.setInteractive({ useHandCursor: true });
      buyBg.on('pointerdown', () => {
        if (Save.spendCoins(def.cost)) {
          Save.addConsumable(kind);
          Audio.play('extraLife');
          if (coinText) coinText.setText(`${Save.get().coins}`);
          ownedText.setText(`x${Save.getConsumableCount(kind)}`);
          spawnScorePopup(this, cx, cy - 30, `+1 ${def.name}`, '#a5d6a7');
        } else {
          Audio.play('miss');
          spawnScorePopup(this, cx, cy - 30, 'Not enough coins!', '#ef5350');
        }
      });

      card.add([bg, icon, name, desc, ownedText, buyBg, buyLabel]);
    });
  }

  private buildSkinsGrid(): void {
    const cardW = GAME_WIDTH - 60;
    const cardH = 110;
    const gap = 14;
    const startY = 270;

    const owned = new Set(Save.getOwnedSkins());
    const active = Save.getActiveSkin();

    SKINS.forEach((skin, i) => {
      const cx = GAME_WIDTH / 2;
      const cy = startY + i * (cardH + gap) + cardH / 2;
      const isOwned = owned.has(skin.id);
      const isActive = active === skin.id;

      const bg = this.add.rectangle(cx, cy, cardW, cardH,
        isActive ? 0x1b5e20 : (isOwned ? 0x3e2723 : 0x263238),
        isActive ? 0.9 : 0.85)
        .setStrokeStyle(3, isActive ? 0x66bb6a : (isOwned ? 0x8d6e63 : 0x546e7a))
        .setOrigin(0.5);

      const previewKey = buildSkinPreview(this, skin.id);
      this.add.image(cx - cardW / 2 + 60, cy, previewKey)
        .setOrigin(0.5).setScale(0.45);

      this.add.text(cx - cardW / 2 + 110, cy - 18, skin.name,
        { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '26px',
          color: isActive ? '#a5d6a7' : '#ffe082' }).setOrigin(0, 0.5);

      if (isActive) {
        this.add.text(cx - cardW / 2 + 110, cy + 14, 'Equipped',
          { fontFamily: 'sans-serif', fontSize: '18px', color: '#81c784', fontStyle: 'bold' }).setOrigin(0, 0.5);
        this.add.image(cx + cardW / 2 - 40, cy, TX.iconCheck)
          .setOrigin(0.5).setScale(0.8);
      } else if (isOwned) {
        const equipBtn = new Button(this, cx + cardW / 2 - 80, cy, {
          label: 'Equip',
          onClick: () => {
            Audio.play('click');
            Save.setActiveSkin(skin.id);
            buildSkinTextures(this, skin.id);
            this.scene.restart({ tab: 'skins' });
          },
          scale: 0.5,
        });
      } else {
        const costCoin = this.add.image(cx + cardW / 2 - 110, cy, TX.coin)
          .setOrigin(0.5).setScale(0.6);
        this.add.text(costCoin.x + 22, cy, `${skin.cost}`,
          { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '22px',
            color: '#ffd54f' }).setOrigin(0, 0.5);

        const buyBtn = new Button(this, cx + cardW / 2 - 50, cy, {
          label: 'Buy',
          onClick: () => {
            if (Save.buySkin(skin.id, skin.cost)) {
              Audio.play('extraLife');
              buildSkinTextures(this, skin.id);
              this.scene.restart({ tab: 'skins' });
            } else {
              Audio.play('miss');
              spawnScorePopup(this, cx, cy - 30, 'Not enough coins!', '#ef5350');
            }
          },
          scale: 0.5,
        });
      }

      void bg;
    });
  }
}
