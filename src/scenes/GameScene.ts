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
import { TS } from '../config/TextStyles';
import { Leaderboard } from '../services/LeaderboardService';
import { LevelCompletePopup } from '../ui/popups/LevelCompletePopup';
import { NamePromptPopup } from '../ui/popups/NamePromptPopup';
import { Challenge } from '../services/ChallengeService';
import type { PowerupKind } from '../ui/PowerupBar';
import { attachAchievementToast } from '../ui/AchievementToast';
import { checkProgress } from '../services/AchievementService';
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
  private misses = 0;
  private combo = 0;
  private levelActive = false;
  private paused = false;
  private endedFlag = false;

  private timeLeft = 0;
  private timerLast = 0;
  private nextSpawnAt = 0;

  private level = 1;
  private challenge: Challenge | null = null;
  private doublePointsActive = false;
  private grantRandomPowerup: (() => void) | null = null;

  constructor() { super('Game'); }

  create(data: { level: number; challenge?: Challenge }): void {
    // CRITICAL: Phaser recycles the scene instance on restart, so class-field
    // initialisers only run once. Any array/reference set on `this` from a
    // previous life is still there. Reset everything here so level N+1
    // doesn't get polluted with destroyed raccoons from level N.
    this.holes = [];
    this.raccoons = [];
    this.tweens.killAll();
    this.time.removeAllEvents();

    this.challenge = data.challenge ?? null;
    this.level = Math.max(1, Math.min(FLAGS.totalLevels, data.level ?? 1));
    this.params = this.challenge ? this.challenge.params : getLevelParams(this.level);
    this.hits = 0;
    this.score = 0;
    this.misses = 0;
    this.combo = 0;
    this.paused = false;
    this.endedFlag = false;
    this.levelActive = false;
    this.timeLeft = this.params.timeLimitMs;
    this.input.enabled = true;

    new ParallaxJungle(this);
    spawnLeafParticles(this);

    this.buildGrid();
    this.hammer = new Hammer(this);
    attachAchievementToast(this);
    // Power-up bar removed from gameplay per playables spec (icons cluttered
    // the play area). Awarded power-ups still stack in the save so a future
    // build can surface them again from a settings screen without code
    // changes.
    this.grantRandomPowerup = () => {
      const kinds: PowerupKind[] = ['freeze', 'double', 'auto'];
      Save.addPowerup(kinds[Math.floor(Math.random() * kinds.length)]);
    };
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
    const bannerText = this.params.isBoss ? `BOSS LEVEL ${this.level}` : I18n.t('level', { n: this.level });
    const bannerStyle = this.params.isBoss ? { ...TS.banner(), color: '#f8bbd0', stroke: '#4a148c' } : TS.banner();
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, bannerText, bannerStyle)
      .setOrigin(0.5).setDepth(15000).setAlpha(0);
    this.tweens.add({ targets: banner, alpha: 1, y: '+=40', duration: 350, ease: 'Back.Out' });
    this.time.delayedCall(900, () => {
      this.tweens.add({ targets: banner, alpha: 0, y: '-=40', duration: 250,
        onComplete: () => banner.destroy() });
    });

    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '3', TS.countdown())
      .setOrigin(0.5).setDepth(15000);
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

    // Boss levels: spawn a boss occasionally (every ~4th spawn),
    // otherwise a regular kind so filler raccoons still contribute.
    let kind: RaccoonKind = 'normal';
    if (this.params.isBoss && Math.random() < 0.28 && this.raccoons.every(r => r.getKind() !== 'boss' || r.isAvailable())) {
      kind = 'boss';
    } else {
      const roll = Math.random();
      const bombEnd = this.params.bombChance;
      const goldenEnd = bombEnd + this.params.goldenChance;
      const frozenEnd = goldenEnd + this.params.frozenChance;
      if (roll < bombEnd) kind = 'bomb';
      else if (roll < goldenEnd) kind = 'golden';
      else if (roll < frozenEnd) kind = 'frozen';
    }

    rac.spawn(kind, this.params.popupVisibleMs,
      (res) => { if (res.finished) this.onRaccoonHit(rac, res.kind, res.points); else this.onPartialHit(rac); },
      () => this.onRaccoonEscape(rac));
  }

  private onPartialHit(rac: Raccoon): void {
    // Frozen or boss took a hit but isn't down yet — small feedback only.
    spawnScorePopup(this, rac.x, rac.y - 30, '+1', '#a5d6a7');
  }

  private onRaccoonHit(rac: Raccoon, kind: RaccoonKind, points: number): void {
    if (!this.levelActive) return;
    if (kind === 'bomb') {
      spawnScorePopup(this, rac.x, rac.y - 60, '-3s', '#ff5252');
      Audio.play('lifeLost');
      this.cameras.main.shake(180, 0.012);
      this.cameras.main.flash(120, 255, 80, 80);
      this.combo = 0;
      this.applyBombPenalty();
      return;
    }
    this.combo++;
    // Juice: screen shake + brief camera zoom-punch on hit
    const shakeIntensity = kind === 'boss' ? 0.010 : kind === 'golden' ? 0.006 : 0.004;
    this.cameras.main.shake(90, shakeIntensity);
    const comboMul = this.combo >= 8 ? 3 : this.combo >= 4 ? 2 : 1;
    const base = kind === 'boss' ? 100 : kind === 'golden' ? 30 : kind === 'frozen' ? 20 : 10;
    const doubleMul = this.doublePointsActive ? 2 : 1;
    const pts = base * comboMul * doubleMul;
    this.hits += points;
    this.score += pts;
    const color = kind === 'boss' ? '#e1bee7' : kind === 'golden' ? '#ffd54f' :
                  kind === 'frozen' ? '#81d4fa' : comboMul > 1 ? '#ffeb3b' : '#fff176';
    spawnScorePopup(this, rac.x, rac.y - 60, `+${pts}${comboMul > 1 ? ` x${comboMul}` : ''}`, color);
    if (comboMul > 1) { spawnScorePopup(this, rac.x + 40, rac.y - 110, 'COMBO!', '#ff9800'); Audio.play('combo'); }
    if (kind === 'boss') {
      spawnScorePopup(this, rac.x, rac.y - 150, 'BOSS DOWN!', '#f8bbd0');
      // Boss down grants a random power-up
      if (this.grantRandomPowerup) this.grantRandomPowerup();
    }
    // Combo-10 award: grant power-up
    if (this.combo === 10 && this.grantRandomPowerup) this.grantRandomPowerup();
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.quota);
    if (this.hits >= this.params.quota) this.endLevel(true);
  }

  private onRaccoonEscape(rac: Raccoon): void {
    if (!this.levelActive) return;
    this.combo = 0;
    this.misses++;
    this.score = Math.max(0, this.score - 5);
    spawnScorePopup(this, rac.x, rac.y - 20, '-5', '#ffab91');
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.quota);
    // Every 5 escapes costs a life (in addition to the level-fail rule).
    if (this.misses > 0 && this.misses % 5 === 0) {
      Audio.play('lifeLost');
      Save.loseLife();
      EventBus.emit(EVT.LIFE_CHANGED);
      spawnScorePopup(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '-1 LIFE!', '#ef5350');
      if (Save.get().lives <= 0) this.endLevel(false, true);
    }
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
      if (this.challenge) {
        // Challenge win path: grant reward, mark done, return to Challenge card.
        if (this.challenge.rewardLives > 0) Save.addLife(this.challenge.rewardLives);
        if (this.challenge.rewardBonus > 0) Save.addBonusScore(this.challenge.rewardBonus);
        if (this.challenge.kind === 'daily') Save.markDailyDone(this.challenge.key);
        else Save.markWeeklyDone(this.challenge.key);
        Save.setBestScore(this.score);
        EventBus.emit(EVT.LIFE_CHANGED);
        new LevelCompletePopup(this, {
          level: this.level, stars, score: this.score,
          onNext: () => { this.scene.stop('HUD'); this.scene.start('Challenges'); },
          onMenu: () => this.goMenu(),
        });
        return;
      }
      Save.recordStars(this.level, stars);
      Save.unlockUpTo(this.level + 1);
      Save.setBestScore(this.score);
      // Achievement hooks
      checkProgress('levelClear', this.level);
      if (this.misses === 0) checkProgress('perfect', 1);
      if (this.timeLeft / this.params.timeLimitMs > 0.5) checkProgress('speed', 1);
      if (this.params.isBoss) checkProgress('boss', 1);
      if (this.combo >= 10) checkProgress('combo', 10);
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
        onChallenges: () => { this.scene.stop('HUD'); this.scene.start('Challenges'); },
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
        onChallenges: () => { this.scene.stop('HUD'); this.scene.start('Challenges'); },
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

  private applyPowerup(kind: PowerupKind): void {
    if (!this.levelActive || this.paused) { Save.addPowerup(kind); return; }
    if (kind === 'freeze') {
      this.paused = true;
      this.time.delayedCall(3000, () => { this.paused = false; this.timerLast = this.time.now; });
      spawnScorePopup(this, GAME_WIDTH / 2, 300, 'TIME FROZEN', '#81d4fa');
    } else if (kind === 'double') {
      this.doublePointsActive = true;
      this.time.delayedCall(10000, () => { this.doublePointsActive = false; });
      spawnScorePopup(this, GAME_WIDTH / 2, 300, 'x2 SCORE', '#ffca28');
    } else if (kind === 'auto') {
      // Instantly finish every currently-up raccoon
      this.raccoons.forEach(r => {
        if (!r.isAvailable() && r.getKind() !== 'bomb') {
          const k = r.getKind();
          r.forceHide();
          const pts = k === 'boss' ? 100 : k === 'golden' ? 30 : k === 'frozen' ? 20 : 10;
          this.hits += k === 'boss' ? 3 : k === 'golden' ? 3 : k === 'frozen' ? 2 : 1;
          this.score += pts;
        }
      });
      spawnScorePopup(this, GAME_WIDTH / 2, 300, 'AUTO HIT!', '#ef5350');
      EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.quota);
      if (this.hits >= this.params.quota) this.endLevel(true);
    }
  }

  private computeStars(): number {
    const timeFrac = this.timeLeft / this.params.timeLimitMs;
    if (timeFrac > 0.5) return 3;
    if (timeFrac > 0.2) return 2;
    return 1;
  }
}
