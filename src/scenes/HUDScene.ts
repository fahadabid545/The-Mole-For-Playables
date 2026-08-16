import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/GameConfig';
import { LivesBar } from '../ui/LivesBar';
import { EventBus, EVT } from '../utils/EventBus';
import { TX } from '../objects/TextureFactory';
import { Audio } from '../services/AudioService';
import { Save } from '../services/SaveService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { ConsumableBar } from '../ui/ConsumableBar';
import { GAME_HEIGHT } from '../config/GameConfig';

export interface HUDData {
  level: number;
  quota: number;
  scoreTarget: number;
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
  private targetText!: Phaser.GameObjects.Text;
  private scoreBarFill!: Phaser.GameObjects.Rectangle;
  private timeBarFill!: Phaser.GameObjects.Rectangle;
  private timeLimitMs = 1;
  private scoreTarget = 1;
  private coinText!: Phaser.GameObjects.Text;

  constructor() { super('HUD'); }

  create(data: HUDData): void {
    this.timeLimitMs = data.timeLimitMs;
    this.scoreTarget = data.scoreTarget;

    this.add.image(GAME_WIDTH / 2, TOP_SAFE + 90, TX.hudBar).setOrigin(0.5).setDepth(-1);

    this.levelText = this.add.text(24, TOP_SAFE + 20, I18n.t('level', { n: data.level }), TS.hudBig());

    const targetBarW = 200, targetBarH = 14;
    this.targetText = this.add.text(24, TOP_SAFE + 72, `0 / ${data.scoreTarget}`, TS.hudSmall());
    this.add.rectangle(24, TOP_SAFE + 100, targetBarW, targetBarH, 0x000000, 0.4).setOrigin(0, 0.5);
    this.scoreBarFill = this.add.rectangle(24, TOP_SAFE + 100, 0, targetBarH, 0xffd54f, 1).setOrigin(0, 0.5);

    this.scoreText = this.add.text(GAME_WIDTH / 2, TOP_SAFE + 30, '0', TS.score()).setOrigin(0.5, 0);

    const coinIcon = this.add.image(GAME_WIDTH / 2 - 40, TOP_SAFE + 80, TX.coin).setOrigin(0.5).setScale(0.7);
    this.coinText = this.add.text(coinIcon.x + 22, TOP_SAFE + 72, `${Save.get().coins}`, TS.hudSmall());

    this.timeText = this.add.text(GAME_WIDTH - 24, TOP_SAFE + 30, this.fmt(data.timeLimitMs),
      { ...TS.hudBig('#fffde7'), stroke: '#b71c1c' }).setOrigin(1, 0);

    const barW = 240, barH = 14;
    this.add.rectangle(GAME_WIDTH - 24 - barW, TOP_SAFE + 96, barW, barH, 0x000000, 0.4).setOrigin(0, 0.5);
    this.timeBarFill = this.add.rectangle(GAME_WIDTH - 24 - barW, TOP_SAFE + 96, barW, barH, 0x66bb6a, 1).setOrigin(0, 0.5);

    new LivesBar(this, 40, TOP_SAFE + 140);

    const iconX = GAME_WIDTH - 90;
    const iconY = TOP_SAFE + 190;
    const sound = this.add.image(iconX, iconY, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });
    const pauseBg = this.add.circle(iconX, iconY + 80, 36, 0x263238, 0.85)
      .setStrokeStyle(3, 0xffb300);
    const pause = this.add.image(iconX, iconY + 80, TX.pause).setOrigin(0.5).setScale(1.1);
    pauseBg.setInteractive({ useHandCursor: true });
    pauseBg.on('pointerdown', () => this.scene.get('Game').events.emit('request-pause'));
    pauseBg.on('pointerover', () => pause.setScale(1.25));
    pauseBg.on('pointerout',  () => pause.setScale(1.1));

    // Hide the HUD sound + pause icons while a popup covers the game
    // so the popup's close-X doesn't visually overlap them.
    const setIconsVisible = (v: boolean) => {
      sound.setVisible(v);
      pauseBg.setVisible(v);
      pause.setVisible(v);
    };
    const gameScene = this.scene.get('Game');
    gameScene.events.on('hud-icons-hide', () => setIconsVisible(false));
    gameScene.events.on('hud-icons-show', () => setIconsVisible(true));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameScene.events.off('hud-icons-hide');
      gameScene.events.off('hud-icons-show');
    });

    new ConsumableBar(this, GAME_HEIGHT - 60);

    const onScore = (score: number, _hits: number, target: number) => {
      this.scoreText.setText(`${score}`);
      this.targetText.setText(`${Math.min(score, target)} / ${target}`);
      const frac = Math.min(1, score / target);
      this.scoreBarFill.width = 200 * frac;
    };
    const onCoins = (coins: number) => {
      this.coinText.setText(`${coins}`);
    };
    const onTimer = (msLeft: number) => {
      this.timeText.setText(this.fmt(msLeft));
      this.timeText.setColor(msLeft < 5000 ? '#ff5252' : '#fffde7');
      const frac = Math.max(0, Math.min(1, msLeft / this.timeLimitMs));
      this.timeBarFill.width = 240 * frac;
      this.timeBarFill.fillColor = msLeft < 5000 ? 0xef5350 : msLeft < 10000 ? 0xffb300 : 0x66bb6a;
    };
    EventBus.on(EVT.SCORE_CHANGED, onScore);
    EventBus.on(EVT.COINS_CHANGED, onCoins);
    EventBus.on(EVT.TIMER_TICK, onTimer);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(EVT.SCORE_CHANGED, onScore);
      EventBus.off(EVT.TIMER_TICK, onTimer);
      EventBus.off(EVT.COINS_CHANGED, onCoins);
    });
  }

  private fmt(ms: number): string {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
