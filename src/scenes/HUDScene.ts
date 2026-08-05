import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { LivesBar } from '../ui/LivesBar';
import { EventBus, EVT } from '../utils/EventBus';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';

export interface HUDData {
  level: number;
  quota: number;
  timeLimitMs: number;
}

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
    this.levelText = this.add.text(20, 20, `L ${data.level}`, {
      fontFamily: 'Impact, sans-serif', fontSize: '36px', color: '#fffde7', stroke: '#1b5e20', strokeThickness: 6,
    });
    this.quotaText = this.add.text(20, 66, `Hits 0/${data.quota}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#fffde7', stroke: '#1b5e20', strokeThickness: 4,
    });

    this.scoreText = this.add.text(GAME_WIDTH / 2, 30, '0', {
      fontFamily: 'Impact, sans-serif', fontSize: '44px', color: '#fff176', stroke: '#3e2723', strokeThickness: 6,
    }).setOrigin(0.5, 0);

    this.timeText = this.add.text(GAME_WIDTH - 20, 30, this.fmt(data.timeLimitMs), {
      fontFamily: 'Impact, sans-serif', fontSize: '40px', color: '#fffde7', stroke: '#b71c1c', strokeThickness: 6,
    }).setOrigin(1, 0);

    // Timer bar
    const barW = 240, barH = 12;
    this.add.rectangle(GAME_WIDTH - 20 - barW, 90, barW, barH, 0x000000, 0.35).setOrigin(0, 0.5);
    this.timeBarFill = this.add.rectangle(GAME_WIDTH - 20 - barW, 90, barW, barH, 0x66bb6a, 1).setOrigin(0, 0.5);

    new LivesBar(this, 24, 120);

    // Sound + pause icons
    const sound = this.add.image(GAME_WIDTH - 60, 130, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });
    const pause = this.add.image(GAME_WIDTH - 60, 210, TX.pause)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    pause.on('pointerdown', () => this.scene.get('Game').events.emit('request-pause'));

    EventBus.on(EVT.SCORE_CHANGED, (score: number, hits: number, quota: number) => {
      this.scoreText.setText(`${score}`);
      this.quotaText.setText(`Hits ${hits}/${quota}`);
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
