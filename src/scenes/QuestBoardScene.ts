import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Audio } from '../services/AudioService';
import { TX } from '../objects/TextureFactory';
import { TS } from '../config/TextStyles';
import { AdBanner } from '../ui/AdBanner';
import { fadeIn, fadeTo } from '../utils/SceneTransition';
import { Analytics } from '../services/AnalyticsService';
import { Save } from '../services/SaveService';
import { EventBus, EVT } from '../utils/EventBus';
import {
  getDailyQuests, getWeeklyQuests, claimQuest, getTotalMedals,
  type QuestSlot,
} from '../services/QuestService';

export class QuestBoardScene extends Phaser.Scene {
  constructor() { super('QuestBoard'); }

  create(): void {
    fadeIn(this);
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 130, TX.signHang).setOrigin(0.5).setDepth(99);
    this.add.text(GAME_WIDTH / 2, 138, 'Jungle Board', TS.title('#fff5c9')).setOrigin(0.5).setDepth(100);

    const medals = getTotalMedals();
    const medalIcon = this.add.image(GAME_WIDTH / 2 - 70, 210, TX.iconMedal).setOrigin(0.5).setScale(0.7);
    this.add.text(medalIcon.x + 30, 210, `${medals} Medals`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '28px', color: '#ffd54f' }).setOrigin(0, 0.5);

    const daily = getDailyQuests();
    const weekly = getWeeklyQuests();

    let cy = 290;
    cy = this.buildSection(cy, 'Daily Quests', 0xffb300, daily, 'daily');
    cy += 20;
    this.buildSection(cy, 'Weekly Quests', 0xef5350, weekly, 'weekly');

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 130, {
      label: 'Back', onClick: () => fadeTo(this, 'Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
  }

  private buildSection(startY: number, title: string, accent: number,
    quests: QuestSlot[], kind: 'daily' | 'weekly'): number {
    const headerBg = this.add.rectangle(GAME_WIDTH / 2, startY, GAME_WIDTH - 40, 48, accent, 0.9)
      .setOrigin(0.5).setStrokeStyle(2, 0x000000);
    this.add.text(GAME_WIDTH / 2, startY, title,
      { ...TS.h2('#3e2723'), fontSize: '30px' }).setOrigin(0.5);

    let y = startY + 56;
    quests.forEach((slot, i) => {
      y = this.buildQuestRow(y, slot, kind, i);
    });
    void headerBg;
    return y;
  }

  private buildQuestRow(y: number, slot: QuestSlot, kind: 'daily' | 'weekly', index: number): number {
    const cardW = GAME_WIDTH - 50;
    const cardH = 100;
    const cx = GAME_WIDTH / 2;
    const done = slot.state.progress >= slot.def.target;
    const claimed = slot.state.claimed;

    const bg = this.add.rectangle(cx, y + cardH / 2, cardW, cardH,
      claimed ? 0x2e7d32 : (done ? 0xfff8e1 : 0x3e2723),
      claimed ? 0.6 : (done ? 0.95 : 0.8))
      .setStrokeStyle(3, claimed ? 0x66bb6a : (done ? 0xffb300 : COLORS.woodDark)).setOrigin(0.5);

    const iconX = cx - cardW / 2 + 44;
    const icon = this.add.image(iconX, y + cardH / 2, slot.def.icon)
      .setOrigin(0.5).setScale(0.65);
    if (claimed) icon.setAlpha(0.5);

    const labelColor = claimed ? '#a5d6a7' : (done ? '#3e2723' : '#fff8e1');
    this.add.text(iconX + 40, y + cardH / 2 - 14, slot.def.label,
      { fontFamily: 'Arial, sans-serif', fontSize: '22px', color: labelColor, fontStyle: 'bold' })
      .setOrigin(0, 0.5);

    const frac = Math.min(1, slot.state.progress / slot.def.target);
    const barW = 240;
    const barH = 10;
    const barX = iconX + 40;
    const barY = y + cardH / 2 + 18;
    this.add.rectangle(barX, barY, barW, barH, 0x000000, 0.35).setOrigin(0, 0.5);
    this.add.rectangle(barX, barY, barW * frac, barH, done ? 0x66bb6a : 0xffb300, 1).setOrigin(0, 0.5);
    this.add.text(barX + barW + 8, barY,
      `${Math.min(slot.state.progress, slot.def.target)}/${slot.def.target}`,
      { fontFamily: 'Arial, sans-serif', fontSize: '16px',
        color: claimed ? '#81c784' : '#bcaaa4', fontStyle: 'bold' }).setOrigin(0, 0.5);

    if (done && !claimed) {
      const claimBtn = new Button(this, cx + cardW / 2 - 70, y + cardH / 2, {
        label: 'Claim',
        onClick: () => {
          Audio.play('extraLife');
          Analytics.questClaimed(`${kind}_${index}`, kind);
          const reward = claimQuest(kind, index);
          if (reward > 0) {
            EventBus.emit(EVT.COINS_CHANGED, Save.get().coins);
            this.scene.restart();
          }
        },
        scale: 0.5,
      });
      this.tweens.add({ targets: claimBtn, scale: { from: 0.48, to: 0.52 },
        yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut' });
    } else if (claimed) {
      this.add.image(cx + cardW / 2 - 40, y + cardH / 2, TX.iconCheck)
        .setOrigin(0.5).setScale(0.8).setAlpha(0.7);
    }

    const coinIcon = this.add.image(cx + cardW / 2 - 140, y + cardH / 2 + 20, TX.coin)
      .setOrigin(0.5).setScale(0.55);
    this.add.text(coinIcon.x + 18, coinIcon.y, `+${slot.def.coinReward}`,
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '18px',
        color: claimed ? '#81c784' : '#ffd54f' }).setOrigin(0, 0.5);

    void bg;
    return y + cardH + 10;
  }
}
