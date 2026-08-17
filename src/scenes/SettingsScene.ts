import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { Popup } from '../ui/popups/Popup';
import { Ads } from '../services/AdsService';
import { Haptic } from '../services/HapticService';
import { EventBus, EVT } from '../utils/EventBus';
import { fadeIn, fadeTo } from '../utils/SceneTransition';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(): void {
    fadeIn(this);
    new ParallaxJungle(this);
    spawnLeafParticles(this);

    const signBg = this.add.image(GAME_WIDTH / 2, 100, TX.signHang).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, signBg.y + 14, I18n.t('settings'), TS.title()).setOrigin(0.5);

    let y = 260;

    // --- Sound section ---
    this.add.text(80, y, 'Sound', TS.h2('#fff8e1')).setOrigin(0, 0.5);
    y += 60;

    const makeToggle = (label: string, isMuted: () => boolean, toggle: () => boolean, yPos: number) => {
      const txt = this.add.text(80, yPos, `${label}: ${isMuted() ? 'Off' : 'On'}`,
        TS.body('#ffe082')).setOrigin(0, 0.5);
      const bg = this.add.circle(GAME_WIDTH - 100, yPos, 32, 0x263238, 0.85)
        .setStrokeStyle(3, 0xffb300).setInteractive({ useHandCursor: true });
      const icon = this.add.image(GAME_WIDTH - 100, yPos, isMuted() ? TX.soundOff : TX.soundOn)
        .setOrigin(0.5).setScale(0.9);
      bg.on('pointerdown', () => {
        const m = toggle();
        icon.setTexture(m ? TX.soundOff : TX.soundOn);
        txt.setText(`${label}: ${m ? 'Off' : 'On'}`);
        Audio.play('click');
      });
      bg.on('pointerover', () => this.tweens.add({ targets: icon, scale: 1.05, duration: 100 }));
      bg.on('pointerout', () => this.tweens.add({ targets: icon, scale: 0.9, duration: 100 }));
    };

    makeToggle('SFX', () => Audio.isSfxMuted(), () => Audio.toggleSfxMute(), y);
    y += 70;
    makeToggle('Music', () => Audio.isMusicMuted(), () => Audio.toggleMusicMute(), y);

    // --- Haptic section ---
    if (Haptic.isSupported()) {
      y += 70;
      const hapticLabel = () => Save.isHapticDisabled() ? 'Off' : 'On';
      const hapTxt = this.add.text(80, y, `Vibration: ${hapticLabel()}`,
        TS.body('#ffe082')).setOrigin(0, 0.5);
      const hapBg = this.add.circle(GAME_WIDTH - 100, y, 32, 0x263238, 0.85)
        .setStrokeStyle(3, 0xffb300).setInteractive({ useHandCursor: true });
      hapBg.on('pointerdown', () => {
        const now = !Save.isHapticDisabled();
        Save.setHapticDisabled(now);
        hapTxt.setText(`Vibration: ${now ? 'Off' : 'On'}`);
        if (!now) Haptic.vibrate(20);
        Audio.play('click');
      });
    }

    // --- Player info section ---
    y += 100;
    this.add.text(80, y, 'Player', TS.h2('#fff8e1')).setOrigin(0, 0.5);
    y += 50;
    const name = Save.get().playerName || 'Anonymous';
    this.add.text(80, y, `Name: ${name}`, TS.body('#bcaaa4')).setOrigin(0, 0.5);
    y += 40;
    const stats = Save.get();
    this.add.text(80, y, `Best Score: ${stats.bestScore}`, TS.body('#bcaaa4')).setOrigin(0, 0.5);
    y += 40;
    this.add.text(80, y, `Stars: ${stats.totalStars}`, TS.body('#bcaaa4')).setOrigin(0, 0.5);
    y += 40;
    this.add.text(80, y, `Coins: ${stats.coins}`, TS.body('#bcaaa4')).setOrigin(0, 0.5);

    // --- Ad buttons for QA ---
    y += 80;
    this.add.text(80, y, 'Rewards', TS.h2('#fff8e1')).setOrigin(0, 0.5);
    y += 70;
    new Button(this, GAME_WIDTH / 2, y, {
      label: '+1 Life (Watch Ad)',
      onClick: async () => {
        const r = await Ads.showRewarded();
        if (r === 'reward') {
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
          Audio.play('extraLife');
        }
      },
      scale: 0.85, variant: 'ad',
    });

    // --- Reset progress ---
    y += 140;
    new Button(this, GAME_WIDTH / 2, y, {
      label: 'Reset Progress',
      onClick: () => this.confirmReset(),
      scale: 0.85, variant: 'ad',
    });

    // --- Credits ---
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 280,
      'Jungle Mole v0.3',
      { ...TS.body('#8d6e63'), align: 'center', fontSize: '20px' }).setOrigin(0.5);

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 180, {
      label: I18n.t('back'), onClick: () => fadeTo(this, 'Menu'), scale: 0.85,
    });

    new AdBanner(this).show();
  }

  private confirmReset(): void {
    const popup = new Popup(this);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140,
      'Reset ALL progress?',
      { ...TS.title('#b71c1c'), fontSize: '44px' }).setOrigin(0.5);
    const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60,
      'This cannot be undone.',
      { ...TS.body('#3e2723'), align: 'center', fontSize: '28px' }).setOrigin(0.5);
    const yes = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, {
      label: 'Yes, reset',
      onClick: () => popup.close(() => { Save.reset(); this.scene.restart(); }),
      variant: 'ad',
    });
    const no = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, {
      label: 'Cancel', onClick: () => popup.close(), scale: 0.8,
    });
    popup.addContent(title, sub, yes, no);
  }
}
