import Phaser from 'phaser';
// Self-hosted cartoon font — bundled into the single-file build,
// no external network needed (playables-safe).
import '@fontsource/luckiest-guy/400.css';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { ChallengesScene } from './scenes/ChallengesScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { SettingsScene } from './scenes/SettingsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#8fd4e8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: { activePointers: 2 },
  render: { antialias: true, pixelArt: false, roundPixels: false },
  scene: [BootScene, PreloadScene, MenuScene, LevelSelectScene, GameScene, HUDScene, LeaderboardScene, ChallengesScene, AchievementsScene, SettingsScene],
};

function boot() { new Phaser.Game(config); }

// Wait for our cartoon font to be ready so first-render text uses it
// instead of a system-font flash.
if ('fonts' in document) {
  (document as any).fonts.load('16px "Luckiest Guy"').then(boot).catch(boot);
} else { boot(); }
