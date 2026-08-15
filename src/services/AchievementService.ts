import { Save } from './SaveService';
import { EventBus } from '../utils/EventBus';
import { TX } from '../objects/TextureFactory';
import { Portal } from './Portal';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  // Texture-factory key of the icon shown alongside this achievement.
  // Each entry uses a distinct icon so the list doesn't just repeat a
  // generic trophy.
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win',    title: 'First Blood',      desc: 'Win your first level.',                            icon: TX.iconMedal },
  { id: 'ten-levels',   title: 'Getting Started',  desc: 'Clear 10 levels.',                                 icon: TX.iconTarget },
  { id: 'fifty-levels', title: 'Jungle Master',    desc: 'Clear all 50 levels.',                             icon: TX.iconTrophy },
  { id: 'perfect',      title: 'Untouchable',      desc: 'Clear a level without a single miss.',             icon: TX.iconShield },
  { id: 'ten-combo',    title: 'On Fire',          desc: 'Hit a 10-combo.',                                  icon: TX.iconFlame },
  { id: 'speed-demon',  title: 'Speed Demon',      desc: 'Finish a level with over half the timer left.',    icon: TX.iconBolt },
  { id: 'boss-slayer',  title: 'Boss Slayer',      desc: 'Defeat a boss raccoon.',                           icon: TX.iconSwords },
  { id: 'daily-7',      title: 'Streaker',         desc: 'Complete daily challenges 7 days in a row.',       icon: TX.iconCalendar },
];

export const EVT_ACHIEVEMENT = 'achievement-unlocked';

export function unlock(id: string): boolean {
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return false;
  if (Save.unlockAchievement(id)) {
    EventBus.emit(EVT_ACHIEVEMENT, a);
    // Portal announcement — Playgama surfaces this to the host so
    // some platforms (Yandex, VK) can display a native toast.
    Portal.playerGotAchievement(id);
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
