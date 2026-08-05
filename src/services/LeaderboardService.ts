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
      return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : this.seed();
    } catch { return this.seed(); }
  }
  private write(list: LeaderboardEntry[]): void {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  }
  private seed(): LeaderboardEntry[] {
    const seed: LeaderboardEntry[] = [
      { name: 'Rocky',  score: 4200, level: 40, at: Date.now() - 6e6 },
      { name: 'Mila',   score: 3900, level: 38, at: Date.now() - 5e6 },
      { name: 'Kenji',  score: 3600, level: 34, at: Date.now() - 4e6 },
      { name: 'Aisha',  score: 3300, level: 31, at: Date.now() - 3e6 },
      { name: 'Diego',  score: 2900, level: 28, at: Date.now() - 2e6 },
      { name: 'Nora',   score: 2600, level: 25, at: Date.now() - 1e6 },
      { name: 'Priya',  score: 2200, level: 22, at: Date.now() - 8e5 },
      { name: 'Sven',   score: 1800, level: 18, at: Date.now() - 5e5 },
      { name: 'Luca',   score: 1400, level: 14, at: Date.now() - 2e5 },
      { name: 'Zoe',    score: 1000, level: 10, at: Date.now() - 1e5 },
    ];
    this.write(seed);
    return seed;
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
