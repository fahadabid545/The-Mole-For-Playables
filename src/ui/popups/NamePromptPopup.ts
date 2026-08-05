import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';

const FUN_NAMES = ['Rocky', 'Mila', 'Kenji', 'Aisha', 'Diego', 'Nora', 'Priya', 'Sven', 'Luca', 'Zoe',
  'Rex', 'Tara', 'Nico', 'Iris', 'Kian', 'Mira', 'Otis', 'Vera', 'Bruno', 'Cleo'];

// Kept fully in-canvas (works for playables where an overlaid HTML input might
// misalign inside iframes). A shuffle button rolls through fun defaults; the
// player can pick from four quick-choose chips or shuffle for more.
export class NamePromptPopup extends Popup {
  private chosen: string;
  private display!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, initial: string, onDone: (name: string) => void) {
    super(scene);
    this.chosen = (initial || FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]).slice(0, 16);

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, I18n.t('enterName'),
      TS.title('#2e7d32')).setOrigin(0.5);

    this.display = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, this.chosen,
      { ...TS.hero(), fontSize: '56px' }).setOrigin(0.5);

    // Quick pick chips
    const chipY = GAME_HEIGHT / 2 + 10;
    const picks = this.pickFour();
    const chips = picks.map((n, i) => {
      const t = scene.add.text(GAME_WIDTH / 2 + (i - 1.5) * 130, chipY, n, {
        ...TS.chipDark(),
        backgroundColor: '#2e7d32',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { this.chosen = n; this.display.setText(n); });
      return t;
    });

    const shuffle = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, {
      label: 'Shuffle',
      onClick: () => {
        this.chosen = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
        this.display.setText(this.chosen);
      },
      scale: 0.75,
    });

    const ok = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 190, {
      label: I18n.t('submit'),
      onClick: () => this.close(() => onDone(this.chosen.trim().slice(0, 16) || 'Player')),
    });

    this.addContent(title, this.display, ...chips, shuffle, ok);
  }

  private pickFour(): string[] {
    const pool = [...FUN_NAMES];
    const out: string[] = [];
    for (let i = 0; i < 4; i++) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  }
}
