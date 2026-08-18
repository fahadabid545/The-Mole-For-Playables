import Phaser from 'phaser';
import { TX, buildAllTextures, buildSkinTextures } from '../objects/TextureFactory';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { I18n } from '../services/I18nService';
import { Save } from '../services/SaveService';
import { Portal } from '../services/Portal';

import raccoonUrl from '../assets/sprites/raccoon.png';
import raccoonHitUrl from '../assets/sprites/raccoon-hit.png';
import raccoonGoldenUrl from '../assets/sprites/raccoon-golden.png';
import raccoonFrozenUrl from '../assets/sprites/raccoon-frozen.png';
import raccoonBossUrl from '../assets/sprites/raccoon-boss.png';
import hammerUrl from '../assets/sprites/hammer.png';
import bombUrl from '../assets/sprites/bomb.png';
import catUrl from '../assets/sprites/cat.png';
import goatUrl from '../assets/sprites/goat.png';
import logHoleUrl from '../assets/sprites/log-hole.png';
import bgJungleUrl from '../assets/sprites/bg-jungle.png';
import hammerArcticUrl from '../assets/sprites/hammer-arctic.png';
import hammerGoldenUrl from '../assets/sprites/hammer-golden.png';
import hammerJungleUrl from '../assets/sprites/hammer-jungle.png';
import hammerLavaUrl from '../assets/sprites/hammer-lava.png';
import hammerRoyalUrl from '../assets/sprites/hammer-royal.png';
import hammerShadowUrl from '../assets/sprites/hammer-shadow.png';

const SKIN_HAMMER_URLS: Record<string, string> = {
  arctic: hammerArcticUrl,
  golden: hammerGoldenUrl,
  jungle: hammerJungleUrl,
  lava: hammerLavaUrl,
  royal: hammerRoyalUrl,
  shadow: hammerShadowUrl,
};

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {
    this.load.image(TX.raccoon, raccoonUrl);
    this.load.image(TX.raccoonHit, raccoonHitUrl);
    this.load.image(TX.raccoonGolden, raccoonGoldenUrl);
    this.load.image(TX.raccoonFrozen, raccoonFrozenUrl);
    this.load.image(TX.raccoonBoss, raccoonBossUrl);
    this.load.image(TX.hammer, hammerUrl);
    this.load.image(TX.bomb, bombUrl);
    this.load.image(TX.cat, catUrl);
    this.load.image(TX.goat, goatUrl);
    this.load.image(TX.logHole, logHoleUrl);
    this.load.image(TX.bgSky, bgJungleUrl);
    this.load.image('tx-default-raccoon', raccoonUrl);
    this.load.image('tx-default-raccoon-hit', raccoonHitUrl);
    this.load.image('tx-default-hammer', hammerUrl);
    for (const [skinId, url] of Object.entries(SKIN_HAMMER_URLS)) {
      this.load.image(`tx-hammer-${skinId}`, url);
    }
  }

  create(): void {
    I18n.init(Save.get().lang);
    this.cameras.main.setBackgroundColor('#0d1b0d');
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Jungle Mole', {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '72px',
      color: '#c8e6c9',
    }).setOrigin(0.5);

    buildAllTextures(this);
    buildSkinTextures(this, Save.getActiveSkin());

    // Signal readiness to the portal as soon as textures are built so
    // Playgama's 30-second init watchdog is satisfied even if the intro
    // fade is slow. Ready is idempotent on the portal side.
    Portal.ready();

    this.tweens.add({
      targets: label, alpha: 0, duration: 300, delay: 200,
      onComplete: () => {
        Portal.ready();
        this.scene.start('Menu');
      },
    });

    void COLORS;
  }
}
