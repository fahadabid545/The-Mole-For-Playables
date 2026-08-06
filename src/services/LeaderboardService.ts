import { IS_PLAYABLES } from '../config/BuildFlags';

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  at: number;
}

export interface LeaderboardService {
  submit(name: string, score: number, level: number): Promise<void>;
  top(limit?: number): Promise<LeaderboardEntry[]>;
}

const LOCAL_KEY = 'mole.leaderboard.v1';

class LocalLeaderboard implements LeaderboardService {
  private read(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      // Legacy seeded lists had exactly the fake defaults ("Rocky", "Mila", …).
      // Strip any entry whose player name matches the old seed so pre-existing
      // saves stop showing fake scores after upgrade.
      if (!raw) return [];
      const list = JSON.parse(raw) as LeaderboardEntry[];
      const fakeNames = new Set(['Rocky', 'Mila', 'Kenji', 'Aisha', 'Diego', 'Nora', 'Priya', 'Sven', 'Luca', 'Zoe']);
      return list.filter(e => !fakeNames.has(e.name));
    } catch { return []; }
  }
  private write(list: LeaderboardEntry[]): void {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  }
  async submit(name: string, score: number, level: number): Promise<void> {
    const list = this.read();
    list.push({ name: name || 'You', score, level, at: Date.now() });
    list.sort((a, b) => b.score - a.score);
    this.write(list.slice(0, 100));
  }
  async top(limit = 20): Promise<LeaderboardEntry[]> {
    return this.read().slice(0, limit);
  }
}

// Store-build placeholder: swap in a real HTTP or Firebase impl later.
class RemoteLeaderboard implements LeaderboardService {
  private local = new LocalLeaderboard();
  async submit(name: string, score: number, level: number): Promise<void> {
    // TODO(store): POST { name, score, level } to your backend, then also mirror locally.
    await this.local.submit(name, score, level);
  }
  async top(limit = 20): Promise<LeaderboardEntry[]> {
    // TODO(store): GET /leaderboard/top?limit=... and merge with local best.
    return this.local.top(limit);
  }
}

// Playables cannot make network calls; ship the local implementation.
// Store build uses the remote-capable one (currently local-backed until backend exists).
export const Leaderboard: LeaderboardService = IS_PLAYABLES ? new LocalLeaderboard() : new RemoteLeaderboard();
