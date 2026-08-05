import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { I18n, LANGS, Lang } from '../../services/I18nService';
import { Save } from '../../services/SaveService';
import { Audio } from '../../services/AudioService';

interface Opts {
  onDone: () => void;
  closeable?: boolean;
}

export class WelcomePopup extends Popup {
  constructor(scene: Phaser.Scene, opts: Opts | (() => void)) {
    const o: Opts = typeof opts === 'function' ? { onDone: opts } : opts;
    super(scene, { closeable: !!o.closeable });

    const cx = GAME_WIDTH / 2;
    const topY = GAME_HEIGHT / 2 - 300;

    const title = scene.add.text(cx, topY, I18n.t('welcome'), {
      fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '68px', color: '#1b5e20',
      stroke: '#fff8e1', strokeThickness: 4,
    }).setOrigin(0.5);

    const sub = scene.add.text(cx, topY + 70, I18n.t('chooseLanguage'), {
      fontFamily: 'Arial, sans-serif', fontSize: '30px', color: '#3e2723',
    }).setOrigin(0.5);

    this.addContent(title, sub);

    // 2 columns; last odd item centered in its own row.
    const cols = 2;
    const gapX = 20;
    const gapY = 22;
    const btnW = 260;
    const btnH = 96;
    const startY = topY + 150;

    LANGS.forEach((l, i) => {
      const r = Math.floor(i / cols);
      const isLastLonely = i === LANGS.length - 1 && LANGS.length % cols === 1;
      let x: number;
      if (isLastLonely) {
        x = cx;
      } else {
        const c = i % cols;
        const gridW = cols * btnW + (cols - 1) * gapX;
        const startX = cx - gridW / 2 + btnW / 2;
        x = startX + c * (btnW + gapX);
      }
      const y = startY + r * (btnH + gapY);
      const btn = new Button(scene, x, y, {
        label: l.label,
        onClick: () => {
          Audio.play('click');
          I18n.setLang(l.code as Lang);
          Save.setLang(l.code as Lang);
          Save.setWelcomed();
          this.close(o.onDone);
        },
        scale: 0.72,
      });
      this.addContent(btn);
    });
  }
}
