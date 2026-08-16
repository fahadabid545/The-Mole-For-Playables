export type Lang = 'en';

type Dict = Record<string, string>;

const DICT: Record<Lang, Dict> = {
  en: {
    welcome: 'Welcome!',
    play: 'Play',
    continue: 'Continue',
    levels: 'Levels',
    shop: 'Shop',
    settings: 'Settings',
    back: 'Back',
    menu: 'Menu',
    retry: 'Retry',
    next: 'Next Level',
    resume: 'Resume',
    restart: 'Restart',
    quit: 'Go Home',
    paused: 'Paused',
    levelComplete: 'Level {n} Complete!',
    levelFailed: 'Level {n} Failed',
    outOfLives: 'Out of Lives',
    extraLife: 'Extra Life!',
    extraLifeMsg: 'Every 10 levels you get a\nfree life. Keep it up!',
    encourage: "You'll get 'em\nnext time, buddy!",
    livesLeft: 'Lives left: {n}',
    plusOneLifeAd: '+1 Life  (Watch Ad)',
    unlockNextAd: 'Unlock L{n}  (Watch Ad)',
    watchAdKeep: 'Watch an ad to keep playing.',
    score: 'Score: {n}',
    target: '{a} / {b}',
    world: 'World Leaderboard',
    yourBest: 'Your best: {n}',
    submit: 'Submit',
    enterName: 'Enter your name',
    awesome: 'Awesome!',
    go: 'GO!',
    dailyChallenge: 'Daily Challenge',
    weeklyChallenge: 'Weekly Challenge',
    todaysChallenge: "Today's Challenge",
    thisWeeksChallenge: "This Week's Challenge",
    alreadyDone: 'Come back tomorrow!',
    alreadyDoneWeek: 'Come back next week!',
    reward: 'Reward',
    plusOneLife: '+1 Life',
    plusBonus: '+{n} Bonus Score',
    combo: 'COMBO!',
    level: 'Level {n}',
    challenges: 'Challenges',
    locked: 'Locked',
    coins: '{n} Coins',
    magicBox: 'Magic Box',
    magicBoxReady: 'Open your daily Magic Box!',
    magicBoxWait: 'Come back in {n}h',
    howToPlay: 'How to Play',
  },
};

class I18nImpl {
  private lang: Lang = 'en';
  init(_l: Lang | undefined): void { /* english only */ }
  setLang(_l: Lang): void { /* english only */ }
  getLang(): Lang { return this.lang; }
  isRTL(): boolean { return false; }
  t(key: string, vars: Record<string, string | number> = {}): string {
    const s = DICT[this.lang][key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  }
}

export const I18n = new I18nImpl();
