import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';

// Real name-entry popup. Uses a positioned <input> DOM element overlaid
// on top of the canvas — works inside single-HTML Playables sandboxes
// and gives the native mobile keyboard on touch devices.
export class NamePromptPopup extends Popup {
  private inputEl?: HTMLInputElement;

  constructor(scene: Phaser.Scene, initial: string, onDone: (name: string) => void) {
    super(scene);
    const start = (initial || '').slice(0, 16);

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, I18n.t('enterName'),
      TS.title('#2b1810')).setOrigin(0.5);

    const hint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130,
      'Type your name below', { ...TS.body('#5d3a1a'), fontSize: '24px' }).setOrigin(0.5);

    this.addContent(title, hint);

    // DOM input overlaid at the canvas position. Sized to be finger-friendly.
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 16;
    input.value = start;
    input.autocapitalize = 'words';
    input.placeholder = 'Your name';
    input.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-30%)',
      'width:280px', 'height:48px',
      'padding:8px 14px',
      'font-size:22px',
      'font-family:"Luckiest Guy", Arial, sans-serif',
      'text-align:center',
      'border:4px solid #5d3a1a',
      'border-radius:12px',
      'background:#fff5c9',
      'color:#2b1810',
      'outline:none',
      'z-index:99999',
    ].join(';');
    document.body.appendChild(input);
    this.inputEl = input;
    // Focus after a tick so mobile keyboards trigger reliably
    setTimeout(() => input.focus(), 60);

    const finish = () => {
      const name = (input.value || '').trim().slice(0, 16) || 'Player';
      this.removeInput();
      this.close(() => onDone(name));
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(); });

    const ok = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, {
      label: I18n.t('submit'),
      onClick: finish,
    });
    this.addContent(ok);

    // Clean up the DOM node if the scene shuts down before submit
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeInput());
  }

  private removeInput(): void {
    if (this.inputEl?.parentNode) this.inputEl.parentNode.removeChild(this.inputEl);
    this.inputEl = undefined;
  }
}
