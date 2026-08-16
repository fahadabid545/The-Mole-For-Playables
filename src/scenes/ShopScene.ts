import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { TX } from '../objects/TextureFactory';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { CONSUMABLES, CONSUMABLE_KINDS, type ConsumableKind } from '../config/ConsumableConfig';
import { spawnScorePopup } from '../objects/ScorePopup';
import { fadeIn, fadeTo } from '../utils/SceneTransition';

export class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  create(): void {
    fadeIn(this);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const signBg = this.add.image(GAME_WIDTH / 2, 100, TX.signHang).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, signBg.y + 14, I18n.t('shop'), TS.title()).setOrigin(0.5);

    const coinIcon = this.add.image(30, 180, TX.coin).setOrigin(0, 0.5).setScale(0.9);
    const coinText = this.add.text(coinIcon.x + 36, 180, `${Save.get().coins}`, TS.hudBig()).setOrigin(0, 0.5);

    const cols = 2;
    const cardW = 300;
    const cardH = 100;
    const gapX = 20;
    const gapY = 16;
    const startY = 230;
    const startX = (GAME_WIDTH - cols * cardW - (cols - 1) * gapX) / 2;

    const container = this.add.container(0, 0);
    let scrollY = 0;
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
          coinText.setText(`${Save.get().coins}`);
          ownedText.setText(`x${Save.getConsumableCount(kind)}`);
          spawnScorePopup(this, cx, cy - 30, `+1 ${def.name}`, '#a5d6a7');
        } else {
          Audio.play('miss');
          spawnScorePopup(this, cx, cy - 30, 'Not enough coins!', '#ef5350');
        }
      });

      card.add([bg, icon, name, desc, ownedText, buyBg, buyLabel]);
      container.add(card);
    });

    const totalH = Math.ceil(kinds.length / cols) * (cardH + gapY);
    const maxScroll = Math.max(0, totalH - (GAME_HEIGHT - startY - 160));

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      scrollY = Phaser.Math.Clamp(scrollY - p.velocity.y * 0.02, 0, maxScroll);
      container.y = -scrollY;
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 100, {
      label: I18n.t('back'),
      onClick: () => fadeTo(this, 'Menu'),
    });
  }
}
