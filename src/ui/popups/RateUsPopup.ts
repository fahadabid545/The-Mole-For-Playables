import Phaser from 'phaser';
import { Popup } from './Popup';
import { Button } from '../Button';
import { TX } from '../../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/GameConfig';
import { Audio } from '../../services/AudioService';
import { Save } from '../../services/SaveService';
import { TS } from '../../config/TextStyles';
import { spawnConfetti } from '../../utils/Celebration';

export class RateUsPopup extends Popup {
  constructor(scene: Phaser.Scene, onDone: () => void) {
    super(scene, { closeable: true, onCloseX: onDone, entrance: 'bounce' });

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180,
      'Enjoying Jungle Mole?', TS.title('#2e7d32')).setOrigin(0.5);

    const subtitle = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120,
      'Tap a star to rate us!',
      { ...TS.body('#5d4037'), fontSize: '26px' }).setOrigin(0.5);

    this.addContent(title, subtitle);

    const starY = GAME_HEIGHT / 2 - 30;
    const stars: Phaser.GameObjects.Image[] = [];
    let selectedRating = 0;

    for (let i = 0; i < 5; i++) {
      const s = scene.add.image(
        GAME_WIDTH / 2 + (i - 2) * 72, starY, TX.star,
      ).setOrigin(0.5).setScale(1.1).setTint(0x555555)
        .setInteractive({ useHandCursor: true });
      stars.push(s);
      this.addContent(s);

      s.on('pointerover', () => {
        for (let j = 0; j <= i; j++) stars[j].setTint(0xffd54f);
        for (let j = i + 1; j < 5; j++) {
          if (j >= selectedRating) stars[j].setTint(0x555555);
        }
      });
      s.on('pointerout', () => {
        for (let j = 0; j < 5; j++) {
          stars[j].setTint(j < selectedRating ? 0xffd54f : 0x555555);
        }
      });
      s.on('pointerdown', () => {
        selectedRating = i + 1;
        Audio.play('click');
        for (let j = 0; j < 5; j++) {
          stars[j].setTint(j < selectedRating ? 0xffd54f : 0x555555);
        }
        scene.tweens.add({
          targets: s, scale: 1.5, duration: 100, yoyo: true, ease: 'Back.Out',
        });
      });
    }

    const feedbackText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60,
      '', { ...TS.body('#4e342e'), fontSize: '24px', align: 'center' }).setOrigin(0.5);
    this.addContent(feedbackText);

    const submit = new Button(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, {
      label: 'Submit Rating',
      onClick: () => {
        if (selectedRating === 0) {
          feedbackText.setText('Please tap a star first.');
          scene.tweens.add({ targets: feedbackText, alpha: { from: 0, to: 1 }, duration: 200 });
          return;
        }
        Save.markRated();
        Audio.play('win');
        spawnConfetti(scene);

        feedbackText.setText(
          selectedRating >= 4
            ? 'Thank you! Opening store...'
            : 'Thanks for your feedback!',
        );

        if (selectedRating >= 4) {
          requestStoreReview();
        }

        scene.time.delayedCall(1500, () => this.close(onDone));
      },
    });
    this.addContent(submit);
  }
}

function requestStoreReview(): void {
  try {
    const w = window as any;
    if (typeof w.requestInAppReview === 'function') {
      w.requestInAppReview();
      return;
    }
    if (typeof w.storeReviewUrl === 'string' && w.storeReviewUrl) {
      window.open(w.storeReviewUrl, '_blank');
    }
  } catch { /* ignore */ }
}

export function shouldPromptRateUs(): boolean {
  if (Save.hasRated()) return false;
  if (Save.getRatePromptCount() >= 3) return false;
  const stats = Save.get();
  const gamesPlayed = stats.stats?.totalGamesPlayed ?? 0;
  if (gamesPlayed < 5) return false;
  if (Save.getRatePromptCount() === 0 && gamesPlayed >= 5) return true;
  if (Save.getRatePromptCount() === 1 && stats.totalStars >= 15) return true;
  if (Save.getRatePromptCount() === 2 && gamesPlayed >= 30) return true;
  return false;
}
