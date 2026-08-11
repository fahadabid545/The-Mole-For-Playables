import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getLevelParams, LevelParams } from '../config/LevelConfig';
import { Theme } from '../config/Theme';
import { FLAGS, IS_PORTAL } from '../config/BuildFlags';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Hole } from '../objects/Hole';
import { Raccoon, RaccoonKind } from '../objects/Raccoon';
import { Hammer } from '../objects/Hammer';
import { spawnScorePopup } from '../objects/ScorePopup';
import { EventBus, EVT } from '../utils/EventBus';
import { Save, EnemyStatKey } from '../services/SaveService';
import type { CategoryId } from '../config/Theme';
import { Audio } from '../services/AudioService';
import { Ads } from '../services/AdsService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { LevelCompletePopup } from '../ui/popups/LevelCompletePopup';
import { Portal } from '../services/Portal';
import { NamePromptPopup } from '../ui/popups/NamePromptPopup';
import { Challenge } from '../services/ChallengeService';
import { attachAchievementToast } from '../ui/AchievementToast';
import { checkProgress } from '../services/AchievementService';
import { checkMedals } from '../services/MedalService';
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
  private pauseReasons = new Set<string>();
  private endedFlag = false;

  private timeLeft = 0;
  private timerLast = 0;
  private nextSpawnAt = 0;

  private level = 1;
  private category: CategoryId = 'easy';
  private challenge: Challenge | null = null;
  private runStartMs = 0;
  private lastComboMs = 0;
  private readonly COMBO_DECAY_MS = 4500;
  private bossMaxHp = 0;
  private bossCurHp = 0;

  constructor() { super('Game'); }

  create(data: { level: number; category?: CategoryId; challenge?: Challenge }): void {
    // Phaser recycles the scene instance, so reset per-run state here.
    this.holes = [];
    this.raccoons = [];
    this.tweens.killAll();
    this.time.removeAllEvents();

    this.challenge = data.challenge ?? null;
    this.category = data.category ?? 'easy';
    this.level = Math.max(1, Math.min(FLAGS.totalLevels, data.level ?? 1));
    this.runStartMs = Date.now();
    if (!this.challenge) Save.markPlayed(this.category, this.level);
    this.params = this.challenge ? this.challenge.params : getLevelParams(this.level, this.category);
    Theme.set(this.category);
    this.hits = 0;
    this.score = 0;
    this.misses = 0;
    this.combo = 0;
    this.paused = false;
    this.pauseReasons.clear();
    this.endedFlag = false;
    this.levelActive = false;
    this.timeLeft = this.params.timeLimitMs;
    this.input.enabled = true;
    if (this.params.isBoss) {
      this.bossMaxHp = this.params.quota;
      this.bossCurHp = this.bossMaxHp;
    } else {
      this.bossMaxHp = 0;
      this.bossCurHp = 0;
    }

    new ParallaxJungle(this);
    spawnLeafParticles(this);

    this.buildGrid();
    this.hammer = new Hammer(this);
    attachAchievementToast(this);
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

    const addReason = (reason: string) => {
      // Ad / platform reasons must register even before the level is
      // active, otherwise a stalled ad callback can leave the scene
      // with no visible pause overlay but with input still hitting
      // input handlers.
      const wasPaused = this.pauseReasons.size > 0;
      this.pauseReasons.add(reason);
      if (!wasPaused) {
        this.paused = true;
        this.events.emit('hud-icons-hide');
      }
    };
    const dropReason = (reason: string) => {
      if (!this.pauseReasons.has(reason)) return;
      this.pauseReasons.delete(reason);
      if (this.pauseReasons.size === 0 && this.paused) {
        this.paused = false;
        this.timerLast = this.time.now;
        this.events.emit('hud-icons-show');
      }
    };
    const onAdStart      = () => addReason('ad');
    const onAdEnd        = () => dropReason('ad');
    const onPlatformP    = () => addReason('platform');
    const onPlatformR    = () => dropReason('platform');
    EventBus.on(EVT.AD_START, onAdStart);
    EventBus.on(EVT.AD_END, onAdEnd);
    EventBus.on(EVT.PLATFORM_PAUSE, onPlatformP);
    EventBus.on(EVT.PLATFORM_RESUME, onPlatformR);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(EVT.AD_START, onAdStart);
      EventBus.off(EVT.AD_END, onAdEnd);
      EventBus.off(EVT.PLATFORM_PAUSE, onPlatformP);
      EventBus.off(EVT.PLATFORM_RESUME, onPlatformR);
      this.pauseReasons.clear();
      this.paused = false;
    });
    // Expose so openPause() and popups can add/drop via same ref-count.
    (this as any)._addPauseReason  = addReason;
    (this as any)._dropPauseReason = dropReason;

    this.runCountdown(() => this.startLevel());
  }

  private buildGrid(): void {
    const g = this.params.grid;
    const cellW = (GAME_WIDTH - g.paddingX * 2) / g.cols;
    const usableH = GAME_HEIGHT - g.paddingTop - g.paddingBottom;
    const cellH = usableH / g.rows;
    let idx = 0;
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const x = g.paddingX + cellW / 2 + c * cellW;
        const y = g.paddingTop + cellH / 2 + r * cellH;
        const hole = new Hole(this, x, y, idx);
        const rac = new Raccoon(this, x, y);
        this.holes.push(hole);
        this.raccoons.push(rac);
        idx++;
      }
    }
  }

  private runCountdown(onDone: () => void): void {
    const bannerText = this.params.isBoss ? `BOSS LEVEL ${this.level}` : I18n.t('level', { n: this.level });
    const bannerStyle = this.params.isBoss ? { ...TS.banner(), color: '#f8bbd0', stroke: '#4a148c' } : TS.banner();
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, bannerText, bannerStyle)
      .setOrigin(0.5).setDepth(15000).setAlpha(0);
    this.tweens.add({ targets: banner, alpha: 1, y: '+=40', duration: 350, ease: 'Back.Out' });
    this.time.delayedCall(900, () => {
      this.tweens.add({ targets: banner, alpha: 0, y: '-=40', duration: 250,
        onComplete: () => banner.destroy() });
    });
    if (this.params.isBoss) {
      const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5)
        .setDepth(14000);
      this.cameras.main.shake(400, 0.008);
      this.tweens.add({ targets: dim, alpha: 0, duration: 900, delay: 500,
        onComplete: () => dim.destroy() });
      Audio.play('bomb');
    }

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
    Portal.gameplayStart();
  }

  update(time: number): void {
    if (!this.levelActive || this.paused) { this.timerLast = time; return; }
    const dt = time - this.timerLast;
    this.timerLast = time;
    this.timeLeft -= dt;
    EventBus.emit(EVT.TIMER_TICK, this.timeLeft);
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endLevel(false); return; }
    if (this.combo > 0 && time - this.lastComboMs > this.COMBO_DECAY_MS) {
      this.combo = 0;
      EventBus.emit(EVT.COMBO_CHANGED, 0);
    }

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

    let kind: RaccoonKind = 'normal';
    if (this.params.isBoss && Math.random() < 0.28 && this.raccoons.every(r => r.getKind() !== 'boss' || r.isAvailable())) {
      kind = 'boss';
    } else {
      const roll = Math.random();
      const bombEnd = this.params.bombChance;
      const goldenEnd = bombEnd + this.params.goldenChance;
      const frozenEnd = goldenEnd + this.params.frozenChance;
      const catEnd = frozenEnd + this.params.catChance;
      const goatEnd = catEnd + this.params.goatChance;
      if (roll < bombEnd) kind = 'bomb';
      else if (roll < goldenEnd) kind = 'golden';
      else if (roll < frozenEnd) kind = 'frozen';
      else if (roll < catEnd) kind = 'cat';
      else if (roll < goatEnd) kind = 'goat';
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
    Save.recordHit(kindToStatKey(kind));
    if (kind === 'bomb') {
      spawnScorePopup(this, rac.x, rac.y - 60, '-1 LIFE', '#ff5252');
      Audio.play('lifeLost');
      try { navigator.vibrate?.(120); } catch { /* ignore */ }
      this.cameras.main.shake(220, 0.014);
      this.cameras.main.flash(140, 255, 80, 80);
      this.combo = 0;
      Save.loseLife();
      EventBus.emit(EVT.LIFE_CHANGED);
      if (Save.get().lives <= 0) this.endLevel(false, true);
      return;
    }
    if (kind === 'cat' || kind === 'goat') {
      spawnScorePopup(this, rac.x, rac.y - 60, '-2s -10', '#ff5252');
      Audio.play('miss');
      this.cameras.main.shake(120, 0.008);
      this.combo = 0;
      this.score = Math.max(0, this.score - 10);
      this.timeLeft = Math.max(0, this.timeLeft - 2000);
      EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.quota);
      EventBus.emit(EVT.TIMER_TICK, this.timeLeft);
      return;
    }
    this.combo++;
    this.lastComboMs = this.time.now;
    Save.recordCombo(this.combo);
    EventBus.emit(EVT.COMBO_CHANGED, this.combo);
    try { navigator.vibrate?.(20); } catch { /* ignore */ }
    const shakeIntensity = kind === 'boss' ? 0.010 : kind === 'golden' ? 0.006 : 0.004;
    this.cameras.main.shake(90, shakeIntensity);
    const comboMul = this.combo >= 8 ? 3 : this.combo >= 4 ? 2 : 1;
    const base = kind === 'boss' ? 100 : kind === 'golden' ? 30 : kind === 'frozen' ? 20 : 10;
    const pts = base * comboMul;
    this.hits += points;
    this.score += pts;
    const color = kind === 'boss' ? '#e1bee7' : kind === 'golden' ? '#ffd54f' :
                  kind === 'frozen' ? '#81d4fa' : comboMul > 1 ? '#ffeb3b' : '#fff176';
    spawnScorePopup(this, rac.x, rac.y - 60, `+${pts}${comboMul > 1 ? ` x${comboMul}` : ''}`, color);
    if (comboMul > 1) { spawnScorePopup(this, rac.x + 40, rac.y - 110, 'COMBO!', '#ff9800'); Audio.play('combo'); }
    if (this.params.isBoss && (kind === 'boss' || kind === 'normal' || kind === 'golden' || kind === 'frozen')) {
      this.bossCurHp = Math.max(0, this.bossCurHp - points);
      EventBus.emit(EVT.BOSS_HP, this.bossCurHp, this.bossMaxHp);
    }
    if (kind === 'boss') {
      spawnScorePopup(this, rac.x, rac.y - 150, 'BOSS DOWN!', '#f8bbd0');
    }
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.quota);
    if (this.hits >= this.params.quota) this.endLevel(true);
  }

  private onRaccoonEscape(rac: Raccoon): void {
    if (!this.levelActive) return;
    if (this.combo > 0) { this.combo = 0; EventBus.emit(EVT.COMBO_CHANGED, 0); }
    this.misses++;
    Save.recordEscape();
    Save.recordMiss();
    this.score = Math.max(0, this.score - 5);
    spawnScorePopup(this, rac.x, rac.y - 20, '-5', '#ffab91');
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.quota);
    // Every 5 escapes costs a life on top of the level-fail rule.
    if (this.misses > 0 && this.misses % 5 === 0) {
      Audio.play('lifeLost');
      Save.loseLife();
      EventBus.emit(EVT.LIFE_CHANGED);
      spawnScorePopup(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '-1 LIFE!', '#ef5350');
      if (Save.get().lives <= 0) this.endLevel(false, true);
    }
  }

  private endLevel(won: boolean, outOfLives = false): void {
    if (this.endedFlag) return;
    this.endedFlag = true;
    this.levelActive = false;
    this.raccoons.forEach(r => r.forceHide());
    Portal.gameplayStop();

    if (!won) {
      Save.loseLife();
      EventBus.emit(EVT.LIFE_CHANGED);
      Audio.play('lifeLost');
      if (Save.get().lives <= 0) outOfLives = true;
    }

    if (won) {
      const stars = this.computeStars();
      if (this.challenge) {
        if (this.challenge.rewardLives > 0) Save.addLife(this.challenge.rewardLives);
        if (this.challenge.kind === 'daily') Save.markDailyDone(this.challenge.key);
        else Save.markWeeklyDone(this.challenge.key);
          EventBus.emit(EVT.LIFE_CHANGED);
        new LevelCompletePopup(this, {
          level: this.level, stars, score: this.score,
          onNext: () => { this.scene.stop('HUD'); this.scene.start('Challenges'); },
          onMenu: () => this.goMenu(),
        });
        return;
      }
      Save.recordStars(this.category, this.level, stars);
      if (stars === 3) {
        this.cameras.main.flash(220, 255, 220, 120);
        this.cameras.main.shake(180, 0.006);
      }
      Save.unlockUpTo(this.category, this.level + 1);
      Save.recordLevelClear(!!this.params.isBoss);
      Save.recordPlayMs(Date.now() - this.runStartMs);
      checkProgress('levelClear', this.level);
      if (this.misses === 0) checkProgress('perfect', 1);
      if (this.timeLeft / this.params.timeLimitMs > 0.5) checkProgress('speed', 1);
      if (this.params.isBoss) checkProgress('boss', 1);
      if (this.combo >= 10) checkProgress('combo', 10);
      checkMedals();
      if (!IS_PORTAL && !Save.get().playerName) {
        new NamePromptPopup(this, '', (n) => { Save.setPlayerName(n); });
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
        onReplay: () => this.restart(),
        onMenu: () => this.goMenu(),
      });
    } else if (outOfLives || Save.get().lives <= 0) {
      this.showOutOfLivesPopup();
    } else {
      new LevelFailedPopup(this, {
        level: this.level,
        onRetry: () => this.restart(),
        // Fire-and-forget: the popup stays open while the ad plays.
        // Restart on any outcome (retry-with-life on reward, plain
        // retry on skip) so the popup is destroyed by scene teardown.
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
    this.scene.start('Game', { level: next, category: this.category });
  }
  private restart(): void {
    if (Save.get().lives <= 0) {
      this.showOutOfLivesPopup();
      return;
    }
    // Preserve challenge context on retry so a mid-challenge fail doesn't
    // silently drop into plain-level mode.
    if (this.challenge) {
      this.scene.stop('HUD');
      this.scene.start('Game', { level: this.level, challenge: this.challenge });
      return;
    }
    this.scene.stop('HUD');
    this.scene.start('Game', { level: this.level, category: this.category });
  }
  private goMenu(): void {
    this.scene.stop('HUD');
    this.scene.start('Menu');
  }

  // Central OutOfLives handler. On ad skip/error the popup reopens so
  // the player is never trapped in a stalled-ad-frozen scene: they can
  // retry the ad, hit Menu, or wait for lives to regen.
  private showOutOfLivesPopup(): void {
    const nextLvl = this.level + 1 <= FLAGS.totalLevels ? this.level + 1 : undefined;
    new OutOfLivesPopup(this, {
      levelToUnlock: nextLvl,
      // Ad buttons in the popup are fire-and-forget: the popup does
      // NOT close itself. Reward path restarts the scene (destroying
      // the popup with it). Skip/error path leaves the popup visible
      // so the player can pick Menu, X, or hit the ad button again —
      // no stalled-close hang possible.
      onWatchAdForLife: async () => {
        const r = await Ads.showRewarded();
        if (r === 'reward') {
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
          this.restart();
        }
      },
      onWatchAdToUnlock: nextLvl ? async () => {
        const r = await Ads.showRewarded();
        if (r === 'reward') {
          Save.unlockUpTo(this.category, nextLvl);
          Save.addLife(1);
          EventBus.emit(EVT.LIFE_CHANGED);
          this.scene.stop('HUD');
          this.scene.start('Game', { level: nextLvl, category: this.category });
        }
      } : undefined,
      onChallenges: () => { this.scene.stop('HUD'); this.scene.start('Challenges'); },
      onMenu: () => this.goMenu(),
      onLivesRefilled: () => this.restart(),
    });
  }

  private openPause(): void {
    if (!this.levelActive || this.paused) return;
    (this as any)._addPauseReason?.('manual');
    new PausePopup(this, {
      onResume: () => (this as any)._dropPauseReason?.('manual'),
      onRestart: () => { (this as any)._dropPauseReason?.('manual'); this.restart(); },
      onQuit: () => { (this as any)._dropPauseReason?.('manual'); this.goMenu(); },
    });
  }

  private computeStars(): number {
    const timeFrac = this.timeLeft / this.params.timeLimitMs;
    if (timeFrac > 0.5) return 3;
    if (timeFrac > 0.2) return 2;
    return 1;
  }
}

function kindToStatKey(k: RaccoonKind): EnemyStatKey {
  switch (k) {
    case 'boss': return 'boss';
    case 'golden': return 'golden';
    case 'frozen': return 'frozen';
    case 'bomb': return 'bomb';
    case 'cat': return 'cat';
    case 'goat': return 'goat';
    default: return 'raccoon';
  }
}
