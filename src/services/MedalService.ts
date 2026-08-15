import { Save } from './SaveService';
import { Portal } from './Portal';

export interface Medal {
  id: string;
  title: string;
  how: string;
  earned: (s: ReturnType<typeof Save.get>) => boolean;
}

export const ALL_MEDALS: Medal[] = [
  { id: 'first-blood',    title: 'First Whack', how: 'Whack your first raccoon.',
    earned: s => s.stats.hits.raccoon >= 1 },
  { id: 'combo-10',       title: 'Combo x10',   how: 'Land a 10-hit combo.',
    earned: s => s.stats.bestCombo >= 10 },
  { id: 'combo-20',       title: 'Combo x20',   how: 'Land a 20-hit combo.',
    earned: s => s.stats.bestCombo >= 20 },
  { id: 'boss-slayer',    title: 'Boss Slayer', how: 'Defeat 5 bosses.',
    earned: s => s.stats.bossesDefeated >= 5 },
  { id: 'raccoon-100',    title: 'Century',     how: 'Whack 100 raccoons.',
    earned: s => s.stats.hits.raccoon >= 100 },
  { id: 'golden-25',      title: 'Gold Rush',   how: 'Whack 25 golden moles.',
    earned: s => s.stats.hits.golden >= 25 },
  { id: 'streak-3',       title: '3-Day Streak',how: 'Play 3 days in a row.',
    earned: s => s.playStreak.longest >= 3 },
  { id: 'streak-7',       title: 'Weeklong',    how: 'Play 7 days in a row.',
    earned: s => s.playStreak.longest >= 7 },
  { id: 'stars-30',       title: '30-Star Cub', how: 'Collect 30 total stars.',
    earned: s => (s.categories.easy.totalStars + s.categories.hard.totalStars + s.categories.superHard.totalStars) >= 30 },
  { id: 'stars-75',       title: 'Star Hunter', how: 'Collect 75 total stars.',
    earned: s => (s.categories.easy.totalStars + s.categories.hard.totalStars + s.categories.superHard.totalStars) >= 75 },
  { id: 'no-bombs',       title: 'Bomb Averse', how: 'Clear 5 levels without hitting a bomb.',
    earned: s => s.stats.levelsCleared >= 5 && s.stats.hits.bomb === 0 },
  { id: 'super-hard-1',   title: 'Into the Dark', how: 'Clear a Super Hard level.',
    earned: s => s.categories.superHard.highestUnlockedLevel > 1 },
  { id: 'champion-150',   title: '150 Champion', how: 'Reach 150 total stars across categories.',
    earned: s => (s.categories.easy.totalStars + s.categories.hard.totalStars + s.categories.superHard.totalStars) >= 150 },
];

export function medalById(id: string): Medal | undefined {
  return ALL_MEDALS.find(m => m.id === id);
}

export function checkMedals(): string[] {
  const s = Save.get();
  const newly: string[] = [];
  for (const m of ALL_MEDALS) {
    if (!s.medals.includes(m.id) && m.earned(s)) {
      if (Save.awardMedal(m.id)) {
        newly.push(m.id);
        Portal.playerGotAchievement(m.id);
      }
    }
  }
  return newly;
}
