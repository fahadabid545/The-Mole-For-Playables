import Phaser from 'phaser';
import { EventBus } from '../utils/EventBus';
import { EVT_ACHIEVEMENT, Achievement } from '../services/AchievementService';
import { TS } from '../config/TextStyles';
import { GAME_WIDTH } from '../config/GameConfig';
import { Audio } from '../services/AudioService';

// Global toast displayed in whichever scene attaches it. Shows
// briefly at the top when an achievement unlocks anywhere.
export function attachAchievementToast(scene: Phaser.Scene): void {
  const handler = (a: Achievement) => {
    Audio.play('extraLife');
    const y = 160;
    const g = scene.add.container(GAME_WIDTH / 2, -80).setDepth(30000);
    const bg = scene.add.rectangle(0, 0, 560, 100, 0x263238, 0.95).setStrokeStyle(4, 0xffb300);
    const icon = scene.add.image(-230, 0, a.icon).setOrigin(0.5).setScale(0.8);
    const title = scene.add.text(-170, -20, 'Achievement!', TS.h2('#ffb300')).setOrigin(0, 0.5);
    const name = scene.add.text(-170, 16, a.title, TS.body('#fff8e1')).setOrigin(0, 0.5);
    g.add([bg, icon, title, name]);
    scene.tweens.add({ targets: g, y, duration: 380, ease: 'Back.Out' });
    scene.time.delayedCall(2200, () => {
      scene.tweens.add({ targets: g, y: -120, alpha: 0, duration: 300, onComplete: () => g.destroy() });
    });
  };
  EventBus.on(EVT_ACHIEVEMENT, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.off(EVT_ACHIEVEMENT, handler));
}
