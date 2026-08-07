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
import { ChallengesScene } from './scenes/ChallengesScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { SettingsScene } from './scenes/SettingsScene';

// iOS Safari's WebGL context creation sometimes hangs or silently fails
// inside portal iframes (CrazyGames player, embedded webviews), leaving
// the page stuck on the body background color. Detect iOS/iPadOS and
// force the 2D Canvas renderer, which is slower but boots reliably.
const ua = navigator.userAgent || '';
const isIOS = /iP(hone|ad|od)/.test(ua) ||
              (ua.includes('Mac') && 'ontouchend' in document);

const config: Phaser.Types.Core.GameConfig = {
  type: isIOS ? Phaser.CANVAS : Phaser.AUTO,
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
  scene: [BootScene, PreloadScene, MenuScene, LevelSelectScene, GameScene, HUDScene, ChallengesScene, AchievementsScene, SettingsScene],
};

let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  new Phaser.Game(config);
}

// Wait up to 1.5s for the cartoon font, then boot regardless. On some
// mobile browsers document.fonts.load() never resolves (and never rejects
// either), which used to leave the page stuck on the blue background
// forever. The race guarantees the game starts either way.
if ('fonts' in document) {
  Promise.race([
    (document as any).fonts.load('16px "Luckiest Guy"'),
    new Promise((res) => setTimeout(res, 1500)),
  ]).then(boot, boot);
  // Absolute safety net — even if the Promise machinery is broken.
  setTimeout(boot, 2500);
} else {
  boot();
}
