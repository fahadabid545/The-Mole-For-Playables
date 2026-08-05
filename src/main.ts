import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0d1b0d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: { activePointers: 2 },
  render: { antialias: true, pixelArt: false, roundPixels: false },
  scene: [BootScene, PreloadScene, MenuScene, LevelSelectScene, GameScene, HUDScene, LeaderboardScene],
};

new Phaser.Game(config);
