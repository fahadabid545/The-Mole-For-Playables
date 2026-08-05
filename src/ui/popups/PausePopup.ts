import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';

interface Opts {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export class PausePopup extends Popup {
  constructor(scene: Phaser.Scene, o: Opts) {
    super(scene);
    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, 'Paused', {
      fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '52px', color: '#3e2723',
    }).setOrigin(0.5);
    const resume = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, {
      label: 'Resume', onClick: () => this.close(o.onResume),
    });
    const mute = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, {
      label: Audio.isMuted() ? 'Sound: Off' : 'Sound: On',
      onClick: () => { Audio.toggleMute(); this.close(() => o.onResume()); },
      scale: 0.85,
    });
    const restart = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, {
      label: 'Restart', onClick: () => this.close(o.onRestart), scale: 0.85,
    });
    const quit = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 240, {
      label: 'Quit to Menu', onClick: () => this.close(o.onQuit), scale: 0.8,
    });
    this.addContent(title, resume, mute, restart, quit);
  }
}
