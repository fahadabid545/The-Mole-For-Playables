import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRID } from '../config/GameConfig';
import { getLevelParams, LevelParams } from '../config/LevelConfig';
import { FLAGS, IS_PORTAL } from '../config/BuildFlags';
import { ParallaxJungle } from '../objects/ParallaxJungle';
import { spawnLeafParticles } from '../objects/LeafParticles';
import { Hole } from '../objects/Hole';
import { Raccoon, RaccoonKind } from '../objects/Raccoon';
import { Hammer } from '../objects/Hammer';
import { spawnScorePopup } from '../objects/ScorePopup';
import { TX } from '../objects/TextureFactory';
import { EventBus, EVT } from '../utils/EventBus';
import { Save } from '../services/SaveService';
import { Audio } from '../services/AudioService';
import { Ads } from '../services/AdsService';
import { I18n } from '../services/I18nService';
import { TS } from '../config/TextStyles';
import { LevelCompletePopup } from '../ui/popups/LevelCompletePopup';
import { Portal } from '../services/Portal';
import { NamePromptPopup } from '../ui/popups/NamePromptPopup';
import { Challenge } from '../services/ChallengeService';
import type { PowerupKind } from '../ui/PowerupBar';
import type { ConsumableKind } from '../config/ConsumableConfig';
import { attachAchievementToast } from '../ui/AchievementToast';
import { checkProgress } from '../services/AchievementService';
import { LevelFailedPopup } from '../ui/popups/LevelFailedPopup';
import { OutOfLivesPopup } from '../ui/popups/OutOfLivesPopup';
import { ExtraLifePopup } from '../ui/popups/ExtraLifePopup';
import { PausePopup } from '../ui/popups/PausePopup';
import { celebrateBossDown, celebrateComboMilestone } from '../utils/Celebration';

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
  private lastHitTime = 0;

  private level = 1;
  private challenge: Challenge | null = null;
  private doublePointsActive = false;
  private freezeActive = false;
  private shieldActive = false;
  private slowmoActive = false;
  private goldenTouchActive = false;
  private bombDefuseActive = false;
  private frenzyActive = false;
  private luckyActive = false;
  private magnetHitsLeft = 0;
  private multiTapActive = false;
  private xrayActive = false;
  private xrayIndicators: Phaser.GameObjects.Arc[] = [];
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
    this.doublePointsActive = false;
    this.freezeActive = false;
    this.shieldActive = false;
    this.slowmoActive = false;
    this.goldenTouchActive = false;
    this.bombDefuseActive = false;
    this.frenzyActive = false;
    this.luckyActive = false;
    this.magnetHitsLeft = 0;
    this.multiTapActive = false;
    this.xrayActive = false;
    this.xrayIndicators = [];
    this.timeLeft = this.params.timeLimitMs;
    this.input.enabled = true;

    new ParallaxJungle(this, this.level);
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
      level: this.level, quota: this.params.quota, scoreTarget: this.params.scoreTarget, timeLimitMs: this.params.timeLimitMs,
    });
    EventBus.emit(EVT.SCORE_CHANGED, 0, 0, this.params.scoreTarget);
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

    // Pause the game while any ad is displayed — the timer and taps
    // freeze exactly like the pause popup, so a mid-game interstitial
    // never eats the player's clock.
    const onAdStart = () => {
      if (this.levelActive && !this.paused) {
        this.paused = true;
        this.events.emit('hud-icons-hide');
      }
    };
    const onAdEnd = () => {
      if (this.levelActive && this.paused) {
        this.paused = false;
        this.timerLast = this.time.now;
        this.events.emit('hud-icons-show');
      }
    };
    EventBus.on(EVT.AD_START, onAdStart);
    EventBus.on(EVT.AD_END, onAdEnd);
    // Host opened a system overlay (Playgama PAUSE_STATE_CHANGED); use
    // the same freeze/thaw path as ads so the timer + taps stop.
    EventBus.on(EVT.PLATFORM_PAUSE, onAdStart);
    EventBus.on(EVT.PLATFORM_RESUME, onAdEnd);

    const onVisChange = () => {
      if (document.hidden) onAdStart();
      else onAdEnd();
    };
    document.addEventListener('visibilitychange', onVisChange);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(EVT.AD_START, onAdStart);
      EventBus.off(EVT.AD_END, onAdEnd);
      EventBus.off(EVT.PLATFORM_PAUSE, onAdStart);
      EventBus.off(EVT.PLATFORM_RESUME, onAdEnd);
      document.removeEventListener('visibilitychange', onVisChange);
    });

    const onConsumableUsed = (kind: ConsumableKind) => {
      switch (kind) {
        case 'freeze': this.freezeActive = true; break;
        case 'double': this.doublePointsActive = true; break;
        case 'magnet': this.magnetHitsLeft = 3; break;
        case 'shield': this.shieldActive = true; break;
        case 'slowmo': this.slowmoActive = true; break;
        case 'goldenTouch': this.goldenTouchActive = true; break;
        case 'bombDefuse': this.bombDefuseActive = true; break;
        case 'frenzy': this.frenzyActive = true; break;
        case 'lucky': this.luckyActive = true; break;
        case 'timeWarp': this.timeLeft += 10000; EventBus.emit(EVT.TIMER_TICK, this.timeLeft); break;
        case 'multiTap': this.multiTapActive = true; break;
        case 'xray': this.xrayActive = true; this.showXrayIndicators(); break;
      }
    };
    const onConsumableExpired = (kind: ConsumableKind) => {
      switch (kind) {
        case 'freeze': this.freezeActive = false; break;
        case 'double': this.doublePointsActive = false; break;
        case 'multiTap': this.multiTapActive = false; break;
        case 'xray': this.xrayActive = false; this.hideXrayIndicators(); break;
        case 'shield': this.shieldActive = false; break;
        case 'slowmo': this.slowmoActive = false; break;
        case 'goldenTouch': this.goldenTouchActive = false; break;
        case 'bombDefuse': this.bombDefuseActive = false; break;
        case 'frenzy': this.frenzyActive = false; break;
        case 'lucky': this.luckyActive = false; break;
      }
    };
    EventBus.on(EVT.CONSUMABLE_USED, onConsumableUsed);
    EventBus.on(EVT.CONSUMABLE_EXPIRED, onConsumableExpired);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(EVT.CONSUMABLE_USED, onConsumableUsed);
      EventBus.off(EVT.CONSUMABLE_EXPIRED, onConsumableExpired);
    });

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
    const introDelay = this.showNewEnemyIntro();

    this.time.delayedCall(introDelay, () => {
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
    });
  }

  private showNewEnemyIntro(): number {
    interface EnemyIntro { icon: string; name: string; desc: string; }
    const intros: EnemyIntro[] = [];
    if (this.level === FLAGS.goldenRaccoonFromLevel) {
      intros.push({ icon: TX.raccoonGolden, name: 'Golden Raccoon', desc: 'Rare and fast. Worth triple!' });
    }
    if (this.level === FLAGS.bombsFromLevel) {
      intros.push({ icon: TX.bomb, name: 'Bomb', desc: 'Do NOT tap! You lose a life.' });
    }
    if (this.level === FLAGS.bossEveryNLevels && this.level === FLAGS.bombsFromLevel) {
      intros.push({ icon: TX.raccoonBoss, name: 'Boss Raccoon', desc: 'Tough (3 HP), huge reward!' });
    }
    if (this.level === FLAGS.frozenFromLevel) {
      intros.push({ icon: TX.raccoonFrozen, name: 'Frozen Raccoon', desc: 'Takes 2 hits to defeat.' });
    }
    if (intros.length === 0) return 0;

    const depth = 15500;
    const cardW = 560;
    const cardH = 100 * intros.length + 80;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(cx, cy, cardW, cardH, 0x1b5e20, 0.92)
      .setStrokeStyle(4, 0xa5d6a7).setOrigin(0.5).setDepth(depth).setAlpha(0);
    const title = this.add.text(cx, cy - cardH / 2 + 30, 'NEW ENEMY!',
      { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '34px', color: '#ffca28',
        stroke: '#1b5e20', strokeThickness: 4 }).setOrigin(0.5).setDepth(depth).setAlpha(0);

    const items: Phaser.GameObjects.GameObject[] = [bg, title];
    intros.forEach((entry, idx) => {
      const rowY = cy - cardH / 2 + 80 + idx * 100;
      const icon = this.add.image(cx - 200, rowY, entry.icon).setOrigin(0.5).setScale(0.7).setDepth(depth).setAlpha(0);
      const name = this.add.text(cx - 130, rowY - 16, entry.name,
        { fontFamily: '"Luckiest Guy", Impact, sans-serif', fontSize: '28px', color: '#fff8e1' })
        .setOrigin(0, 0.5).setDepth(depth).setAlpha(0);
      const desc = this.add.text(cx - 130, rowY + 18, entry.desc,
        { fontFamily: 'sans-serif', fontSize: '20px', color: '#a5d6a7' })
        .setOrigin(0, 0.5).setDepth(depth).setAlpha(0);
      items.push(icon, name, desc);
    });

    items.forEach(o => this.tweens.add({ targets: o, alpha: 1, duration: 300, ease: 'Sine.Out' }));
    Audio.play('golden');
    const showMs = 2200;
    this.time.delayedCall(showMs - 300, () => {
      items.forEach(o => this.tweens.add({ targets: o, alpha: 0, duration: 250,
        onComplete: () => (o as unknown as { destroy: () => void }).destroy() }));
    });
    return showMs;
  }

  private showTutorialHint(): void {
    if (this.level > FLAGS.frozenFromLevel) return;

    const showFloating = (text: string, color: string, delay = 0) => {
      this.time.delayedCall(delay, () => {
        const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 200, text, {
          fontFamily: 'Impact, sans-serif', fontSize: '36px', color,
          stroke: '#3e2723', strokeThickness: 5, align: 'center',
        }).setOrigin(0.5).setDepth(9500).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 1, y: hint.y - 30, duration: 400, ease: 'Back.Out' });
        this.tweens.add({ targets: hint, alpha: 0, y: hint.y - 60, delay: 2800, duration: 400,
          onComplete: () => hint.destroy() });
      });
    };

    if (this.level === 1) {
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
      showFloating('Hit raccoons before\nthey escape!', '#fff176', 4000);
    } else if (this.level === FLAGS.goldenRaccoonFromLevel) {
      showFloating('Golden raccoons\nare worth triple!', '#ffd54f', 2000);
    } else if (this.level === FLAGS.bombsFromLevel) {
      showFloating('Avoid the bombs!\nYou lose a life.', '#ff5252', 2000);
    } else if (this.level === FLAGS.frozenFromLevel) {
      showFloating('Frozen raccoons\nneed 2 hits!', '#81d4fa', 2000);
    }
  }

  private startLevel(): void {
    this.levelActive = true;
    this.timerLast = this.time.now;
    this.nextSpawnAt = this.time.now + 300;
    this.showTutorialHint();
    Portal.gameplayStart();
    Save.recordGamePlayed();
  }

  update(time: number): void {
    if (!this.levelActive || this.paused) { this.timerLast = time; return; }
    const dt = time - this.timerLast;
    this.timerLast = time;
    if (!this.freezeActive) this.timeLeft -= dt;
    EventBus.emit(EVT.TIMER_TICK, this.timeLeft);
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endLevel(false); return; }

    if (this.combo > 0 && time - this.lastHitTime > 3000) {
      this.combo = 0;
      EventBus.emit(EVT.COMBO_CHANGED, 0);
    }

    if (time >= this.nextSpawnAt) {
      const activeCount = this.raccoons.filter(r => !r.isAvailable()).length;
      if (activeCount < this.params.simultaneousMax) this.spawnOne();
      const intervalMul = this.frenzyActive ? 0.5 : 1;
      this.nextSpawnAt = time + this.params.popupIntervalMs * intervalMul + Phaser.Math.Between(-120, 220);
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

    if (this.bombDefuseActive && kind === 'bomb') kind = 'normal';
    if (this.luckyActive && kind === 'normal' && Math.random() < this.params.goldenChance * 2) kind = 'golden';
    const visMs = this.slowmoActive ? this.params.popupVisibleMs * 1.5 : this.params.popupVisibleMs;
    rac.spawn(kind, visMs,
      (res) => { if (res.finished) this.onRaccoonHit(rac, res.kind, res.points); else this.onPartialHit(rac); },
      () => this.onRaccoonEscape(rac));

    if (this.magnetHitsLeft > 0 && kind !== 'bomb') {
      this.magnetHitsLeft--;
      this.time.delayedCall(200, () => {
        if (!rac.isAvailable()) rac.autoHit();
      });
    }
    if (this.xrayActive) this.showXrayIndicators();
  }

  private onPartialHit(rac: Raccoon): void {
    // Frozen or boss took a hit but isn't down yet — small feedback only.
    spawnScorePopup(this, rac.x, rac.y - 30, '+1', '#a5d6a7');
  }

  private onRaccoonHit(rac: Raccoon, kind: RaccoonKind, points: number): void {
    if (!this.levelActive) return;
    Save.recordHit(kind);
    if (kind === 'bomb') {
      if (this.shieldActive) {
        this.shieldActive = false;
        spawnScorePopup(this, rac.x, rac.y - 60, 'BLOCKED!', '#66bb6a');
        Audio.play('combo');
        return;
      }
      spawnScorePopup(this, rac.x, rac.y - 60, '-1 Life', '#ff5252');
      Audio.play('lifeLost');
      this.cameras.main.shake(180, 0.012);
      this.cameras.main.flash(120, 255, 80, 80);
      if (navigator.vibrate && !Save.isHapticDisabled()) navigator.vibrate([30, 50, 60]);
      this.combo = 0;
      EventBus.emit(EVT.COMBO_CHANGED, 0);
      this.applyBombPenalty();
      return;
    }
    this.combo++;
    Save.recordCombo(this.combo);
    EventBus.emit(EVT.COMBO_CHANGED, this.combo);
    this.lastHitTime = this.time.now;
    const shakeIntensity = kind === 'boss' ? 0.010 : kind === 'golden' ? 0.006 : 0.004;
    this.cameras.main.shake(90, shakeIntensity);
    if (navigator.vibrate && !Save.isHapticDisabled()) navigator.vibrate(kind === 'boss' ? 40 : 15);
    const comboMul = this.combo >= 8 ? 3 : this.combo >= 4 ? 2 : 1;
    const goldenValue = this.goldenTouchActive && kind === 'normal';
    const base = kind === 'boss' ? 100 : (kind === 'golden' || goldenValue) ? 30 : kind === 'frozen' ? 20 : 10;
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
      celebrateBossDown(this, rac.x, rac.y);
      if (this.grantRandomPowerup) this.grantRandomPowerup();
    }
    celebrateComboMilestone(this, this.combo);
    if (this.combo === 10 && this.grantRandomPowerup) this.grantRandomPowerup();
    const coinReward = kind === 'boss' ? 5 : kind === 'golden' ? 3 : 1;
    Save.addCoins(coinReward);
    EventBus.emit(EVT.COINS_CHANGED, Save.get().coins);
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.scoreTarget);
    if (this.score >= this.params.scoreTarget) this.endLevel(true);

    if (this.multiTapActive && this.levelActive) {
      this.raccoons.forEach(r => {
        if (r !== rac && !r.isAvailable() && r.getKind() !== 'bomb') {
          r.autoHit();
        }
      });
    }
  }

  private onRaccoonEscape(rac: Raccoon): void {
    if (!this.levelActive) return;
    this.combo = 0;
    EventBus.emit(EVT.COMBO_CHANGED, 0);
    this.misses++;
    Save.recordEscape();
    this.score = Math.max(0, this.score - 5);
    spawnScorePopup(this, rac.x, rac.y - 20, '-5', '#ffab91');
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.hits, this.params.scoreTarget);
  }

  private applyBombPenalty(): void {
    Save.loseLife();
    EventBus.emit(EVT.LIFE_CHANGED);
    if (Save.get().lives <= 0) {
      this.endLevel(false, true);
    }
  }

  private endLevel(won: boolean, outOfLives = false): void {
    if (this.endedFlag) return;
    this.endedFlag = true;
    this.levelActive = false;
    this.raccoons.forEach(r => r.forceHide());
    Portal.gameplayStop();

    if (!won && !outOfLives) {
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
      if (!Save.get().playerName && !IS_PORTAL) {
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
        onRetry: () => this.restart(),
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
    this.events.emit('hud-icons-hide');
    const restoreIcons = () => this.events.emit('hud-icons-show');
    new PausePopup(this, {
      onResume: () => { this.paused = false; this.timerLast = this.time.now; restoreIcons(); },
      onRestart: () => { restoreIcons(); this.restart(); },
      onQuit: () => { restoreIcons(); this.goMenu(); },
    });
  }

  private showXrayIndicators(): void {
    this.hideXrayIndicators();
    this.holes.forEach((hole, i) => {
      if (this.raccoons[i].isAvailable()) {
        const glow = this.add.circle(hole.x, hole.y - 20, 40, 0x64ffda, 0.35).setDepth(hole.depth - 1);
        this.tweens.add({ targets: glow, alpha: { from: 0.15, to: 0.45 }, scale: { from: 0.9, to: 1.1 }, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut' });
        this.xrayIndicators.push(glow);
      }
    });
  }

  private hideXrayIndicators(): void {
    this.xrayIndicators.forEach(g => { this.tweens.killTweensOf(g); g.destroy(); });
    this.xrayIndicators = [];
  }

  private computeStars(): number {
    const timeFrac = this.timeLeft / this.params.timeLimitMs;
    if (timeFrac > 0.5) return 3;
    if (timeFrac > 0.2) return 2;
    return 1;
  }
}
