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

    // DOM input overlaid on top of the game CANVAS (not the viewport).
    // The canvas is letterboxed when the browser is wider than 9:16, so
    // positioning by viewport % floats the input outside the canvas on
    // the left. Instead, we measure the canvas rect every frame while
    // the popup is open and pin the input to canvas-center.
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 16;
    input.value = start;
    input.autocapitalize = 'words';
    input.placeholder = 'Your name';
    input.style.cssText = [
      'position:fixed',
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
      'box-sizing:border-box',
    ].join(';');
    document.body.appendChild(input);
    this.inputEl = input;

    const reposition = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      // Center the input horizontally on the canvas, and place it
      // vertically at the same fraction of the canvas as the popup's
      // input-line (roughly 48% down the game area = around y ~615 of
      // 1280 tall).
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.48;
      const iw = 280, ih = 48;
      input.style.left = `${Math.round(cx - iw / 2)}px`;
      input.style.top  = `${Math.round(cy - ih / 2)}px`;
    };
    reposition();
    window.addEventListener('resize', reposition);
    // Keep track so we can remove the listener on close
    (input as any)._reposition = reposition;
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
    if (this.inputEl) {
      const rep = (this.inputEl as any)._reposition as (() => void) | undefined;
      if (rep) window.removeEventListener('resize', rep);
      if (this.inputEl.parentNode) this.inputEl.parentNode.removeChild(this.inputEl);
      this.inputEl = undefined;
    }
  }
}
