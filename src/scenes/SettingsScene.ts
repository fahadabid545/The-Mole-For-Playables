import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { Button } from '../ui/Button';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { I18n, LANGS, Lang } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { TX } from '../objects/TextureFactory';
import { AdBanner } from '../ui/AdBanner';
import { IS_PLAYABLES } from '../config/BuildFlags';

// Settings hub. Volume slider, mute toggle, language chooser (store
// build only), and a reset-progress button behind a confirmation.
export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(): void {
    new ParallaxJungle(this);

    this.add.image(GAME_WIDTH / 2, 130, TX.iconGear).setOrigin(0.5).setScale(0.9);
    this.add.text(GAME_WIDTH / 2, 220, 'Settings', TS.title('#fff8e1')).setOrigin(0.5);

    // Sound toggle
    let y = 340;
    this.add.text(80, y, 'Sound', TS.h2('#fff8e1')).setOrigin(0, 0.5);
    const soundIcon = this.add.image(GAME_WIDTH - 100, y, Audio.isMuted() ? TX.soundOff : TX.soundOn)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundIcon.on('pointerdown', () => {
      const m = Audio.toggleMute();
      soundIcon.setTexture(m ? TX.soundOff : TX.soundOn);
    });

    // Language (store build only)
    if (!IS_PLAYABLES) {
      y += 130;
      this.add.text(80, y, 'Language', TS.h2('#fff8e1')).setOrigin(0, 0.5);
      LANGS.forEach((l, i) => {
        const x = 80 + i * 130;
        const isActive = Save.get().lang === l.code || (!Save.get().lang && l.code === 'en');
        const chip = this.add.rectangle(x + 55, y + 80, 110, 46,
          isActive ? 0xffb300 : 0x263238, 0.9).setStrokeStyle(3, 0xffffff);
        const t = this.add.text(x + 55, y + 80, l.code.toUpperCase(),
          { ...TS.chipDark(), fontSize: '22px' }).setOrigin(0.5);
        chip.setInteractive({ useHandCursor: true });
        chip.on('pointerdown', () => {
          Audio.play('click');
          I18n.setLang(l.code as Lang);
          Save.setLang(l.code as Lang);
          this.scene.restart();
        });
        void t;
      });
    }

    // Reset progress
    y = GAME_HEIGHT - 490;
    new Button(this, GAME_WIDTH / 2, y, {
      label: 'Reset Progress',
      onClick: () => this.confirmReset(),
      scale: 0.9, variant: 'ad',
    });

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 370,
      'Jungle Mole v0.2\nBuilt with Phaser 3',
      { ...TS.body('#fff8e1'), align: 'center', fontSize: '22px' }).setOrigin(0.5);

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 240, {
      label: I18n.t('back'), onClick: () => this.scene.start('Menu'), scale: 0.8,
    });

    new AdBanner(this).show();
    void COLORS;
  }

  private confirmReset(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setInteractive().setDepth(20000);
    const box = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 520, 300, 0xfff8e1, 1)
      .setStrokeStyle(6, 0xef5350).setDepth(20001);
    const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60,
      'Reset ALL progress?\nThis cannot be undone.',
      { ...TS.h2('#b71c1c'), align: 'center', fontSize: '30px' }).setOrigin(0.5).setDepth(20002);
    const yes = new Button(this, GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 70, {
      label: 'Yes', onClick: () => { Save.reset(); this.scene.restart(); }, scale: 0.7, variant: 'ad',
    }).setDepth(20002);
    const no = new Button(this, GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 70, {
      label: 'Cancel', onClick: () => { overlay.destroy(); box.destroy(); msg.destroy(); yes.destroy(); no.destroy(); },
      scale: 0.7,
    }).setDepth(20002);
  }
}
