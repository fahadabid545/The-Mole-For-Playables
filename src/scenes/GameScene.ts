import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRID } from '../config/GameConfig';
import { getLevelParams, LevelParams } from '../config/LevelConfig';
import { FLAGS } from '../config/BuildFlags';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Hole } from '../objects/Hole';
import { Raccoon, RaccoonKind } from '../objects/Raccoon';
import { Hammer } from '../objects/Hammer';
import { spawnScorePopup } from '../objects/ScorePopup';
import { EventBus, EVT } from '../utils/EventBus';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { Ads } from '../services/AdsService';
import { I18n } from '../services/I18nService';
import { Leaderboard } from '../services/LeaderboardService';
import { LevelCompletePopup } from '../ui/popups/LevelCompletePopup';
import { NamePromptPopup } from '../ui/popups/NamePromptPopup';
import { LevelFailedPopup } from '../ui/popups/LevelFailedPopup';
import { OutOfLivesPopup } from '../ui/popups/OutOfLivesPopup';
import { ExtraLifePopup } from '../ui/popups/ExtraLifePopup';
import { PausePopup } from '../ui/popups/PausePopup';

export class GameScene extends Phaser.Scene {
  private params!: LevelParams;
  private holes: Hole[] = [];
  private raccoons: Raccoon[] = [];
  private hammer!: Hammer;

  private hits = 0;
  private score = 0;
  private levelActive = false;
  private paused = false;
  private endedFlag = false;

  private timeLeft = 0;
  private timerLast = 0;
  private nextSpawnAt = 0;

  private level = 1;

  constructor() { super('Game'); }

  create(data: { level: number }): void {
    this.level = Math.max(1, Math.min(FLAGS.totalLevels, data.level ?? 1));
    this.params = getLevelParams(this.level);
    this.hits = 0;
    this.score = 0;
    this.paused = false;
    this.endedFlag = false;
    this.timeLeft = this.params.timeLimitMs;

    new ParallaxJungle(this);
    spawnLeafParticles(this);

    this.buildGrid();
    this.hammer = new Hammer(this);
    document.body.classList.add('playing');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.body.classList.remove('playing'));

    this.scene.launch('HUD', {
      level: this.level, quota: this.params.quota, timeLimitMs: this.params.timeLimitMs,
    });
    EventBus.emit(EVT.SCORE_CHANGED, 0, 0, this.params.quota);
    EventBus.emit(EVT.TIMER_TICK, this.timeLeft);

    // Ground-tap (miss) feedback: taps that don't hit a raccoon.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (!this.levelActive || this.paused) return;
      if (targets.length === 0) {
        Audio.play('miss');
        spawnScorePopup(this, p.worldX, p.worldY - 20, 'miss', '#ffab91');
      }
    });

    this.events.on('request-pause', () => this.openPause());

    // Small "3-2-1-Go!" countdown, then start
    this.runCountdown(() => this.startLevel());
  }

  private buildGrid(): void {
    const cellW = (GAME_WIDTH - GRID.paddingX * 2) / GRID.cols;
    const usableH = GAME_HEIGHT - GRID.paddingTop - GRID.paddingBottom;
    const cellH = usableH / GRID.rows;
    let idx = 0;
    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++) {
        const x = GRID.paddingX + cellW / 2 + c * cellW;
        const y = GRID.paddingTop + cellH / 2 + r * cellH;
        const hole = new Hole(this, x, y, idx);
        const rac = new Raccoon(this, x, y);
        this.holes.push(hole);
        this.raccoons.push(rac);
        idx++;
      }
    }
  }

  private runCountdown(onDone: () => void): void {
    // Level intro banner slides in and out first
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, `LEVEL ${this.level}`, {
      fontFamily: 'Impact, sans-serif', fontSize: '96px', color: '#fff8e1',
      stroke: '#1b5e20', strokeThickness: 10,
    }).setOrigin(0.5).setDepth(15000).setAlpha(0);
    this.tweens.add({ targets: banner, alpha: 1, y: '+=40', duration: 350, ease: 'Back.Out' });
    this.time.delayedCall(900, () => {
      this.tweens.add({ targets: banner, alpha: 0, y: '-=40', duration: 250,
        onComplete: () => banner.destroy() });
    });

    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '3', {
      fontFamily: 'Impact, sans-serif', fontSize: '200px', color: '#fffde7',
      stroke: '#1b5e20', strokeThickness: 12,
    }).setOrigin(0.5).setDepth(15000);
    const seq = ['3', '2', '1', I18n.t('go')];
    let i = 0;
    const step = () => {
      t.setText(seq[i]);
      t.setScale(0.5);
      this.tweens.add({ targets: t, scale: 1.4, alpha: { from: 1, to: 0.2 }, duration: 550, ease: 'Cubic.Out',
        onComplete: () => {
          i++;
          if (i < seq.length) step();
          else { t.destroy(); onDone(); }
        } });
    };
    step();
  }

  private showTutorialHint(): void {
    // Level-1 only, on first spawn: pulsing "TAP!" over the active raccoon.
    if (this.level !== 1) return;
    const findActive = () => this.raccoons.find(r => !r.isAvailable());
    const timer = this.time.addEvent({
      delay: 100, loop: true,
      callback: () => {
        const rac = findActive();
        if (!rac) return;
        timer.remove();
        const hint = this.add.text(rac.x, rac.y - 160, 'TAP!', {
          fontFamily: 'Impact, sans-serif', fontSize: '48px', color: '#fff176',
          stroke: '#3e2723', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(9500);
        this.tweens.add({ targets: hint, scale: 1.25, yoyo: true, repeat: 4, duration: 260, ease: 'Sine.InOut',
          onComplete: () => hint.destroy() });
        this.time.delayedCall(3000, () => hint.destroy());
      },
    });
  }

  private startLevel(): void {
    this.levelActive = true;
    this.timerLast = this.time.now;
    this.nextSpawnAt = this.time.now + 300;
    this.showTutorialHint();
  }

  update(time: number): void {
    if (!this.levelActive || this.paused) { this.timerLast = time; return; }
    const dt = time - this.timerLast;
    this.timerLast = time;
    this.timeLeft -= dt;
    EventBus.emit(EVT.TIMER_TICK, this.timeLeft);
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endLevel(false); return; }

    if (time >= this.nextSpawnAt) {
      const activeCount = this.raccoons.filter(r => !r.isAvailable()).length;
      if (activeCount < this.params.simultaneousMax) this.spawnOne();
      this.nextSpawnAt = time + this.params.popupIntervalMs + Phaser.Math.Between(-120, 220);
    }
  }

  private spawnOne(): void {
    const free = this.raccoons.filter(r => r.isAvailable());
    if (free.length === 0) return;
    const rac = Phaser.Utils.Array.GetRandom(free) as Raccoon;

    const roll = Math.random();
    let kind: RaccoonKind = 'normal';
    if (roll < this.params.bombChance) kind = 'bomb';
    else if (roll < this.params.bombChance + this.params.goldenChance) kind = 'golden';

    rac.spawn(kind, this.params.popupVisibleMs,
      (res) => this.onRaccoonHit(rac, res.kind, res.points),
      () => this.onRaccoonEscape(rac));
  }

  private onRaccoonHit(rac: Raccoon, kind: RaccoonKind, points: number): void {
    if (!this.levelActive) return;
    if (kind === 'bomb') {
      spawnScorePopup(this, rac.x, rac.y - 60, '-3s', '#ff5252');
      Audio.play('lifeLost');
      this.applyBombPenalty();
      return;
    }
    this.hits += points;
    this.score += kind === 'golden' ? 30 : 10;
    spawnScorePopup(this, rac.x, rac.y - 60, kind === 'golden' ? '+30' : '+10',
      kind === 'golden' ? '#ffd54f' : '#fff176');
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.quota);
    if (this.hits >= this.params.quota) this.endLevel(true);
  }

  private onRaccoonEscape(rac: Raccoon): void {
    if (!this.levelActive) return;
    // No life penalty for a single miss — only failing the level costs a life.
    spawnScorePopup(this, rac.x, rac.y - 20, 'miss!', '#ffab91');
  }

  private applyBombPenalty(): void {
    // Bombs give a small time penalty instead of a life, so lives stay
    // strictly tied to level-fail as the player requested.
    this.timeLeft = Math.max(0, this.timeLeft - 3000);
    EventBus.emit(EVT.TIMER_TICK, this.timeLeft);
  }

  private endLevel(won: boolean, outOfLives = false): void {
    if (this.endedFlag) return;
    this.endedFlag = true;
    this.levelActive = false;
    this.raccoons.forEach(r => r.forceHide());

    if (!won) {
      // Level failed — deduct a life once, then decide fail vs out-of-lives.
      Save.loseLife();
      EventBus.emit(EVT.LIFE_CHANGED);
      Audio.play('lifeLost');
      if (Save.get().lives <= 0) outOfLives = true;
    }

    if (won) {
      const stars = this.computeStars();
      Save.recordStars(this.level, stars);
      Save.unlockUpTo(this.level + 1);
      Save.setBestScore(this.score);
      const submit = () => void Leaderboard.submit(Save.get().playerName || 'Player', this.score, this.level);
      if (!Save.get().playerName) {
        // First win — ask for a name, then submit, then show the complete popup.
        new NamePromptPopup(this, '', (n) => { Save.setPlayerName(n); submit(); });
      } else {
        submit();
      }

      const proceed = () => {
        if (this.level % FLAGS.extraLifeEveryNLevels === 0 && this.level < FLAGS.totalLevels) {
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
          new ExtraLifePopup(this, () => this.postCompleteInterstitial());
        } else {
          this.postCompleteInterstitial();
        }
      };

      new LevelCompletePopup(this, {
        level: this.level, stars, score: this.score,
        onNext: () => proceed(),
        onMenu: () => this.goMenu(),
      });
    } else if (outOfLives || Save.get().lives <= 0) {
      new OutOfLivesPopup(this, {
        levelToUnlock: this.level + 1 <= FLAGS.totalLevels ? this.level + 1 : undefined,
        onWatchAdForLife: async () => {
          const r = await Ads.showRewarded();
          if (r === 'reward') { Save.addLife(1); EventBus.emit(EVT.LIFE_CHANGED); this.restart(); }
          else this.goMenu();
        },
        onWatchAdToUnlock: async () => {
          const r = await Ads.showRewarded();
          if (r === 'reward') {
            Save.unlockUpTo(this.level + 1);
            Save.addLife(1);
            EventBus.emit(EVT.LIFE_CHANGED);
            this.scene.stop('HUD');
            this.scene.start('Game', { level: this.level + 1 });
          } else this.goMenu();
        },
        onMenu: () => this.goMenu(),
      });
    } else {
      new LevelFailedPopup(this, {
        level: this.level,
        onRetry: () => this.restart(),
        onWatchAdForLife: async () => {
          const r = await Ads.showRewarded();
          if (r === 'reward') { Save.addLife(1); EventBus.emit(EVT.LIFE_CHANGED); }
          this.restart();
        },
        onMenu: () => this.goMenu(),
      });
    }
  }

  private postCompleteInterstitial(): void {
    const next = this.level + 1;
    if (next > FLAGS.totalLevels) { this.goMenu(); return; }
    if (Ads.shouldShowInterstitialForLevel(this.level)) {
      Ads.showInterstitial().finally(() => this.goNext(next));
    } else {
      this.goNext(next);
    }
  }

  private goNext(next: number): void {
    this.scene.stop('HUD');
    this.scene.start('Game', { level: next });
  }
  private restart(): void {
    if (Save.get().lives <= 0) {
      new OutOfLivesPopup(this, {
        onWatchAdForLife: async () => {
          const r = await Ads.showRewarded();
          if (r === 'reward') { Save.addLife(1); EventBus.emit(EVT.LIFE_CHANGED); this.restart(); }
          else this.goMenu();
        },
        onMenu: () => this.goMenu(),
      });
      return;
    }
    this.scene.stop('HUD');
    this.scene.start('Game', { level: this.level });
  }
  private goMenu(): void {
    this.scene.stop('HUD');
    this.scene.start('Menu');
  }

  private openPause(): void {
    if (!this.levelActive || this.paused) return;
    this.paused = true;
    new PausePopup(this, {
      onResume: () => { this.paused = false; this.timerLast = this.time.now; },
      onRestart: () => this.restart(),
      onQuit: () => this.goMenu(),
    });
  }

  private computeStars(): number {
    const timeFrac = this.timeLeft / this.params.timeLimitMs;
    if (timeFrac > 0.5) return 3;
    if (timeFrac > 0.2) return 2;
    return 1;
  }
}
