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

// Push HUD elements below browser chrome (notch, address bar).
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
    this.add.image(GAME_WIDTH / 2, TOP_SAFE + 90, TX.hudBar).setOrigin(0.5).setDepth(-1);

    this.levelText = this.add.text(24, TOP_SAFE + 20, I18n.t('level', { n: data.level }), TS.hudBig());
    this.quotaText = this.add.text(24, TOP_SAFE + 76, I18n.t('hits', { a: 0, b: data.quota }), TS.hudSmall());

    this.scoreText = this.add.text(GAME_WIDTH / 2, TOP_SAFE + 30, '0', TS.score()).setOrigin(0.5, 0);

    this.timeText = this.add.text(GAME_WIDTH - 24, TOP_SAFE + 30, this.fmt(data.timeLimitMs),
      { ...TS.hudBig('#fffde7'), stroke: '#b71c1c' }).setOrigin(1, 0);

    const barW = 240, barH = 14;
    this.add.rectangle(GAME_WIDTH - 24 - barW, TOP_SAFE + 96, barW, barH, 0x000000, 0.4).setOrigin(0, 0.5);
    this.timeBarFill = this.add.rectangle(GAME_WIDTH - 24 - barW, TOP_SAFE + 96, barW, barH, 0x66bb6a, 1).setOrigin(0, 0.5);

    new LivesBar(this, 40, TOP_SAFE + 140);

    const iconY = TOP_SAFE + 190;
    const sound = this.add.image(GAME_WIDTH - 92, iconY, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.9);
    sound.on('pointerdown', () => {
      const m = Audio.toggleMute();
      sound.setTexture(m ? TX.soundOff : TX.soundOn);
    });
    const pauseBg = this.add.circle(GAME_WIDTH - 92, iconY + 80, 36, 0x263238, 0.85)
      .setStrokeStyle(3, 0xffb300);
    const pause = this.add.image(GAME_WIDTH - 92, iconY + 80, TX.pause).setOrigin(0.5).setScale(1.1);
    pauseBg.setInteractive({ useHandCursor: true });
    pauseBg.on('pointerdown', () => this.scene.get('Game').events.emit('request-pause'));
    pauseBg.on('pointerover', () => pause.setScale(1.25));
    pauseBg.on('pointerout',  () => pause.setScale(1.1));

    // Hide HUD icons while a popup is on-screen so the popup close-X
    // doesn't visually clash with them.
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

    // Combo meter (below the score)
    const comboBarW = 200, comboBarH = 10;
    const comboBg = this.add.rectangle(GAME_WIDTH / 2, TOP_SAFE + 96, comboBarW, comboBarH, 0x000000, 0.4).setOrigin(0.5);
    const comboFill = this.add.rectangle(GAME_WIDTH / 2 - comboBarW / 2, TOP_SAFE + 96, 0, comboBarH, 0xffca28, 1).setOrigin(0, 0.5);
    const comboLbl = this.add.text(GAME_WIDTH / 2, TOP_SAFE + 76, '', { ...TS.hudSmall('#ffd54f') }).setOrigin(0.5, 1);
    void comboBg;

    // Boss HP bar (hidden until first boss-hp event)
    const bossBarW = GAME_WIDTH - 80, bossBarH = 18;
    const bossLbl = this.add.text(GAME_WIDTH / 2, TOP_SAFE + 250, '', { ...TS.hudSmall('#f8bbd0') }).setOrigin(0.5).setVisible(false);
    const bossBg = this.add.rectangle(GAME_WIDTH / 2, TOP_SAFE + 280, bossBarW, bossBarH, 0x000000, 0.5).setOrigin(0.5).setVisible(false);
    const bossFill = this.add.rectangle(GAME_WIDTH / 2 - bossBarW / 2, TOP_SAFE + 280, 0, bossBarH, 0xef5350, 1).setOrigin(0, 0.5).setVisible(false);

    const onCombo = (combo: number) => {
      const cap = 20;
      const frac = Math.min(1, combo / cap);
      comboFill.width = comboBarW * frac;
      comboLbl.setText(combo > 1 ? `COMBO x${combo >= 8 ? 3 : combo >= 4 ? 2 : 1}` : '');
    };
    EventBus.on(EVT.COMBO_CHANGED, onCombo);

    const onBossHp = (currentHp: number, maxHp: number) => {
      bossLbl.setVisible(true); bossBg.setVisible(true); bossFill.setVisible(true);
      const frac = Math.max(0, Math.min(1, currentHp / maxHp));
      bossFill.width = bossBarW * frac;
      bossLbl.setText(currentHp > 0 ? `BOSS HP  ${currentHp} / ${maxHp}` : 'BOSS DOWN!');
      if (currentHp <= 0) {
        this.time.delayedCall(900, () => { bossLbl.setVisible(false); bossBg.setVisible(false); bossFill.setVisible(false); });
      }
    };
    EventBus.on(EVT.BOSS_HP, onBossHp);

    const onScore = (score: number, hits: number, quota: number) => {
      this.scoreText.setText(`${score}`);
      this.quotaText.setText(I18n.t('hits', { a: hits, b: quota }));
    };
    const onTick = (msLeft: number) => {
      this.timeText.setText(this.fmt(msLeft));
      this.timeText.setColor(msLeft < 5000 ? '#ff5252' : '#fffde7');
      const frac = Math.max(0, Math.min(1, msLeft / this.timeLimitMs));
      this.timeBarFill.width = 240 * frac;
      this.timeBarFill.fillColor = msLeft < 5000 ? 0xef5350 : msLeft < 10000 ? 0xffb300 : 0x66bb6a;
    };
    EventBus.on(EVT.SCORE_CHANGED, onScore);
    EventBus.on(EVT.TIMER_TICK, onTick);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(EVT.SCORE_CHANGED, onScore);
      EventBus.off(EVT.TIMER_TICK, onTick);
      EventBus.off(EVT.COMBO_CHANGED, onCombo);
      EventBus.off(EVT.BOSS_HP, onBossHp);
    });
  }

  private fmt(ms: number): string {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
