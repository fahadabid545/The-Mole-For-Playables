import Phaser from 'phaser';
// Self-hosted so single-file Playables builds ship without a network fetch.
import '@fontsource/luckiest-guy/400.css';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { CategorySelectScene } from './scenes/CategorySelectScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { ChallengesScene } from './scenes/ChallengesScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { SettingsScene } from './scenes/SettingsScene';
import { StatsScene } from './scenes/StatsScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
import { JungleBoardScene } from './scenes/JungleBoardScene';
import { MedalsScene } from './scenes/MedalsScene';
import { EventBus, EVT } from './utils/EventBus';
import { initAdWaitOverlay } from './ui/AdWaitOverlay';

initAdWaitOverlay();

// iOS Safari WebGL context creation hangs inside some portal iframes.
// Fall back to Canvas — slower but boots reliably.
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
  scene: [BootScene, PreloadScene, MenuScene, CategorySelectScene, LevelSelectScene, GameScene, HUDScene, ChallengesScene, AchievementsScene, SettingsScene, StatsScene, HowToPlayScene, JungleBoardScene, MedalsScene],
};

// Only pause when the tab is HIDDEN. Some browsers fire visibilitychange
// during scene transitions or dev-tool docking — those must never leave
// the game paused, so we always emit the paired RESUME when it returns.
let _tabHidden = false;
document.addEventListener('visibilitychange', () => {
  const nowHidden = document.hidden === true;
  if (nowHidden === _tabHidden) return;
  _tabHidden = nowHidden;
  EventBus.emit(nowHidden ? EVT.PLATFORM_PAUSE : EVT.PLATFORM_RESUME);
});
window.addEventListener('focus', () => {
  if (!_tabHidden) return;
  _tabHidden = false;
  EventBus.emit(EVT.PLATFORM_RESUME);
});

let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  const host = document.getElementById('app');
  if (host) host.innerHTML = '';
  new Phaser.Game(config);
}

// document.fonts.load() never resolves on some mobile browsers — race
// against a 1.5s timeout, then a 2.5s hard safety net.
if ('fonts' in document) {
  Promise.race([
    (document as any).fonts.load('16px "Luckiest Guy"'),
    new Promise((res) => setTimeout(res, 1500)),
  ]).then(boot, boot);
  setTimeout(boot, 2500);
} else {
  boot();
}
