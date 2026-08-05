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

  constructor() { super('HUD'); }

  create(data: HUDData): void {
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
