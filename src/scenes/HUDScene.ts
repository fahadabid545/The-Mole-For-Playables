import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { LivesBar } from '../ui/LivesBar';
import { EventBus, EVT } from '../utils/EventBus';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';

export interface HUDData {
  level: number;
  quota: number;
  timeLimitMs: number;
}

// Top-safe padding for browser chrome (notch, address bar).
// Everything HUD-related pushes DOWN by this much so the timer, score,
// and icons stay fully visible instead of getting cropped at the top.
const TOP_SAFE = 60;

export class HUDScene extends Phaser.Scene {
  private levelText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private quotaText!: Phaser.GameObjects.Text;
  private timeBarFill!: Phaser.GameObjects.Rectangle;
  private timeLimitMs = 1;

  constructor() { super('HUD'); }

  create(data: HUDData): void {
    this.timeLimitMs = data.timeLimitMs;
    // Wooden HUD bar background — taller & pushed down so it clears
    // the browser's top chrome and gives the score/timer room.
    this.add.image(GAME_WIDTH / 2, TOP_SAFE + 90, TX.hudBar).setOrigin(0.5).setDepth(-1);

    this.levelText = this.add.text(24, TOP_SAFE + 20, I18n.t('level', { n: data.level }), TS.hudBig());
    this.quotaText = this.add.text(24, TOP_SAFE + 76, I18n.t('hits', { a: 0, b: data.quota }), TS.hudSmall());

    this.scoreText = this.add.text(GAME_WIDTH / 2, TOP_SAFE + 30, '0', TS.score()).setOrigin(0.5, 0);

    this.timeText = this.add.text(GAME_WIDTH - 24, TOP_SAFE + 30, this.fmt(data.timeLimitMs),
      { ...TS.hudBig('#fffde7'), stroke: '#b71c1c' }).setOrigin(1, 0);

    // Timer bar under the numeric time
    const barW = 240, barH = 14;
    this.add.rectangle(GAME_WIDTH - 24 - barW, TOP_SAFE + 96, barW, barH, 0x000000, 0.4).setOrigin(0, 0.5);
    this.timeBarFill = this.add.rectangle(GAME_WIDTH - 24 - barW, TOP_SAFE + 96, barW, barH, 0x66bb6a, 1).setOrigin(0, 0.5);

    new LivesBar(this, 28, TOP_SAFE + 130);

    // Sound + pause icons, tucked below the wooden bar so nothing overlaps
    const iconY = TOP_SAFE + 190;
    const sound = this.add.image(GAME_WIDTH - 64, iconY, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });
    const pauseBg = this.add.circle(GAME_WIDTH - 64, iconY + 80, 36, 0x263238, 0.85)
      .setStrokeStyle(3, 0xffb300);
    const pause = this.add.image(GAME_WIDTH - 64, iconY + 80, TX.pause).setOrigin(0.5).setScale(1.1);
    pauseBg.setInteractive({ useHandCursor: true });
    pauseBg.on('pointerdown', () => this.scene.get('Game').events.emit('request-pause'));
    pauseBg.on('pointerover', () => pause.setScale(1.25));
    pauseBg.on('pointerout',  () => pause.setScale(1.1));

    EventBus.on(EVT.SCORE_CHANGED, (score: number, hits: number, quota: number) => {
      this.scoreText.setText(`${score}`);
      this.quotaText.setText(I18n.t('hits', { a: hits, b: quota }));
    });
    EventBus.on(EVT.TIMER_TICK, (msLeft: number) => {
      this.timeText.setText(this.fmt(msLeft));
      this.timeText.setColor(msLeft < 5000 ? '#ff5252' : '#fffde7');
      const frac = Math.max(0, Math.min(1, msLeft / this.timeLimitMs));
      this.timeBarFill.width = 240 * frac;
      this.timeBarFill.fillColor = msLeft < 5000 ? 0xef5350 : msLeft < 10000 ? 0xffb300 : 0x66bb6a;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(EVT.SCORE_CHANGED);
      EventBus.off(EVT.TIMER_TICK);
    });
  }

  private fmt(ms: number): string {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
