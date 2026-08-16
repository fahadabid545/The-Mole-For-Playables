import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Save } from '../../services/SaveService';
import { Audio } from '../../services/AudioService';
import { TX } from '../../objects/TextureFactory';
import { TS } from '../../config/TextStyles';
import { CONSUMABLE_KINDS, CONSUMABLES, type ConsumableKind } from '../../config/ConsumableConfig';
import { Popup } from './Popup';

interface Reward {
  type: 'coins' | 'consumable' | 'life';
  amount: number;
  kind?: ConsumableKind;
  label: string;
}

function rollReward(): Reward {
  const r = Math.random();
  if (r < 0.35) {
    const coins = Phaser.Math.Between(5, 25);
    return { type: 'coins', amount: coins, label: `${coins} Coins` };
  }
  if (r < 0.85) {
    const kind = CONSUMABLE_KINDS[Math.floor(Math.random() * CONSUMABLE_KINDS.length)];
    return { type: 'consumable', amount: 1, kind, label: CONSUMABLES[kind].name };
  }
  return { type: 'life', amount: 1, label: '+1 Life' };
}

export class MagicBoxPopup extends Popup {
  constructor(scene: Phaser.Scene, onDone: () => void) {
    super(scene, { closeable: false });

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, 'Magic Box', TS.title()).setOrigin(0.5);
    this.addContent(title);

    const chest = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, TX.iconChest).setOrigin(0.5).setScale(2.5);
    this.addContent(chest);

    scene.tweens.add({
      targets: chest, angle: { from: -8, to: 8 }, yoyo: true, repeat: 3,
      duration: 120, ease: 'Sine.InOut',
      onComplete: () => {
        const reward = rollReward();
        this.grantReward(reward);

        scene.tweens.add({
          targets: chest, scaleX: 3.2, scaleY: 3.2, alpha: 0, duration: 400, ease: 'Back.In',
          onComplete: () => chest.setVisible(false),
        });

        const rewardText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, reward.label, {
          ...TS.title(), fontSize: '36px', color: '#ffd54f',
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);
        this.addContent(rewardText);

        scene.tweens.add({
          targets: rewardText, alpha: 1, scale: 1.2, duration: 400, ease: 'Back.Out',
        });

        Audio.play('extraLife');
        Save.markMagicBoxOpened();

        scene.time.delayedCall(1800, () => this.close(onDone));
      },
    });
  }

  private grantReward(reward: Reward): void {
    switch (reward.type) {
      case 'coins':
        Save.addCoins(reward.amount);
        break;
      case 'consumable':
        if (reward.kind) Save.addConsumable(reward.kind, reward.amount);
        break;
      case 'life':
        Save.addLife(reward.amount);
        break;
    }
  }
}
