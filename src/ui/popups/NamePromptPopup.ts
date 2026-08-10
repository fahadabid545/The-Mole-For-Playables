import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';

// Uses a DOM <input> overlaid on the canvas so mobile browsers surface
// the native keyboard.
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

    // Position the input against the canvas rect (not viewport) — the
    // canvas is letterboxed on wide screens and a viewport-relative
    // input floats off-canvas.
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
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.48;
      const iw = 280, ih = 48;
      input.style.left = `${Math.round(cx - iw / 2)}px`;
      input.style.top  = `${Math.round(cy - ih / 2)}px`;
    };
    reposition();
    window.addEventListener('resize', reposition);
    (input as any)._reposition = reposition;
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

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeInput());
  }

  // The DOM input outlives Phaser objects, so tear it down before any
  // close path — including scene shutdown — otherwise it strands on
  // top of the next scene at z-index 99999.
  close(onComplete?: () => void): void {
    this.removeInput();
    super.close(onComplete);
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
