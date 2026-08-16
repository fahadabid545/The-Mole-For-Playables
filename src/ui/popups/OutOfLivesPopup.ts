import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { I18n } from '../../services/I18nService';
import { TS } from '../../config/TextStyles';
import { IS_PLAYABLES } from '../../config/BuildFlags';
import { Save } from '../../services/SaveService';
import { allChallengesDone } from '../../services/ChallengeService';
import { EventBus, EVT } from '../../utils/EventBus';

interface Opts {
  levelToUnlock?: number;
  onWatchAdForLife: () => void;
  onWatchAdToUnlock?: () => void;
  onMenu: () => void;
  onChallenges?: () => void;
  onLivesRefilled?: () => void;
}

export class OutOfLivesPopup extends Popup {
  constructor(scene: Phaser.Scene, o: Opts) {
    super(scene, { closeable: true, onCloseX: o.onMenu, entrance: 'slide-up' });

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, I18n.t('outOfLives'),
      TS.title('#b71c1c')).setOrigin(0.5);

    const hearts: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 5; i++) {
      const h = scene.add.image(GAME_WIDTH / 2 + (i - 2) * 60, GAME_HEIGHT / 2 - 110, TX.heartEmpty)
        .setOrigin(0.5).setScale(0.9);
      hearts.push(h);
    }
    this.addContent(title, ...hearts);

    const challengesDone = allChallengesDone();

    if (challengesDone) {
      // All challenges done — user must wait for the 10-min regen timer.
      const info = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30,
        'Lives refill in', { ...TS.body('#3e2723'), fontSize: '30px' }).setOrigin(0.5);
      const countdown = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30,
        '--:--', { ...TS.title('#1b5e20'), fontSize: '72px' }).setOrigin(0.5);
      this.addContent(info, countdown);

      const tick = () => {
        const at = Save.get().livesRegenAt ?? Date.now();
        const ms = Math.max(0, at - Date.now());
        const s = Math.ceil(ms / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        countdown.setText(`${m}:${sec.toString().padStart(2, '0')}`);
        if (Save.tryRegenLives(true)) {
          EventBus.emit(EVT.LIFE_CHANGED);
          this.close(o.onLivesRefilled ?? o.onMenu);
        }
      };
      tick();
      const timer = scene.time.addEvent({ delay: 1000, loop: true, callback: tick });
      this.once(Phaser.GameObjects.Events.DESTROY, () => timer.remove(false));
    } else if (IS_PLAYABLES) {
      const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20,
        'Earn free lives by completing challenges:\nDaily → +1 life\nWeekly → +3 lives',
        { ...TS.body('#2b1810'), align: 'center', fontSize: '26px' }).setOrigin(0.5);
      this.addContent(msg);
      if (o.onChallenges) {
        const chalBtn = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, {
          label: 'Challenges', onClick: () => this.close(o.onChallenges!), variant: 'ad',
        });
        this.addContent(chalBtn);
      }
    } else {
      const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, I18n.t('watchAdKeep'),
        { ...TS.body('#3e2723'), align: 'center', fontSize: '28px' }).setOrigin(0.5);
      this.addContent(msg);
      const adLife = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, {
        label: I18n.t('plusOneLifeAd'), onClick: () => this.close(o.onWatchAdForLife), variant: 'ad',
      });
      this.addContent(adLife);
      if (o.levelToUnlock && o.onWatchAdToUnlock) {
        const unlock = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 170, {
          label: I18n.t('unlockNextAd', { n: o.levelToUnlock }),
          onClick: () => this.close(o.onWatchAdToUnlock),
          variant: 'ad',
        });
        this.addContent(unlock);
      }
    }

    const menu = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 260, {
      label: I18n.t('menu'), onClick: () => this.close(o.onMenu), scale: 0.7,
    });
    this.addContent(menu);
  }
}
