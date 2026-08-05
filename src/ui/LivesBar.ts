import Phaser from 'phaser';
import { TX } from '../objects/TextureFactory';
import { Save } from '../services/SaveService';
import { EventBus, EVT } from '../utils/EventBus';
import { FLAGS } from '../config/BuildFlags';

export class LivesBar extends Phaser.GameObjects.Container {
  private hearts: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    for (let i = 0; i < FLAGS.maxLives; i++) {
      const h = scene.add.image(i * 44, 0, TX.heartFull).setOrigin(0.5).setScale(0.65);
      this.hearts.push(h);
      this.add(h);
    }
    this.refresh();
    scene.add.existing(this);
    EventBus.on(EVT.LIFE_CHANGED, () => this.refresh());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.off(EVT.LIFE_CHANGED));
  }

  refresh(): void {
    const lives = Save.get().lives;
    this.hearts.forEach((h, i) => {
      const visible = i < FLAGS.maxLives;
      h.setVisible(visible);
      h.setTexture(i < lives ? TX.heartFull : TX.heartEmpty);
    });
  }
}
