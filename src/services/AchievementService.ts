import { Save } from './SaveService';
import { EventBus } from '../utils/EventBus';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win',    title: 'First Blood',      desc: 'Win your first level.' },
  { id: 'ten-levels',   title: 'Getting Started',  desc: 'Clear 10 levels.' },
  { id: 'fifty-levels', title: 'Jungle Master',    desc: 'Clear all 50 levels.' },
  { id: 'perfect',      title: 'Untouchable',      desc: 'Clear a level without a single miss.' },
  { id: 'ten-combo',    title: 'On Fire',          desc: 'Hit a 10-combo.' },
  { id: 'speed-demon',  title: 'Speed Demon',      desc: 'Finish a level with over half the timer left.' },
  { id: 'boss-slayer',  title: 'Boss Slayer',      desc: 'Defeat a boss raccoon.' },
  { id: 'daily-7',      title: 'Streaker',         desc: 'Complete daily challenges 7 days in a row.' },
];

export const EVT_ACHIEVEMENT = 'achievement-unlocked';

export function unlock(id: string): boolean {
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return false;
  if (Save.unlockAchievement(id)) {
    EventBus.emit(EVT_ACHIEVEMENT, a);
    return true;
  }
  return false;
}

export function checkProgress(kind: 'levelClear' | 'combo' | 'perfect' | 'speed' | 'boss' | 'dailyStreak',
                              value: number): void {
  switch (kind) {
    case 'levelClear':
      if (value >= 1) unlock('first-win');
      if (value >= 10) unlock('ten-levels');
      if (value >= 50) unlock('fifty-levels');
      break;
    case 'combo':
      if (value >= 10) unlock('ten-combo');
      break;
    case 'perfect':
      if (value === 1) unlock('perfect');
      break;
    case 'speed':
      if (value === 1) unlock('speed-demon');
      break;
    case 'boss':
      if (value === 1) unlock('boss-slayer');
      break;
    case 'dailyStreak':
      if (value >= 7) unlock('daily-7');
      break;
  }
}
