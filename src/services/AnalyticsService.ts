import { Save } from './SaveService';
import type { Category } from '../config/CategoryConfig';
import type { AdOutcome } from './AdsService';

const STORAGE_KEY = 'mole.analytics';
const MAX_QUEUE_SIZE = 500;
const FLUSH_INTERVAL_MS = 30_000;

interface AnalyticsEvent {
  name: string;
  ts: number;
  props: Record<string, string | number | boolean>;
}

let queue: AnalyticsEvent[] = [];
let sessionStart = Date.now();
let sessionId = Math.random().toString(36).slice(2, 10);
let endpoint: string | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;

function track(name: string, props: Record<string, string | number | boolean> = {}): void {
  queue.push({ name, ts: Date.now(), props: { ...props, sid: sessionId } });
  if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-MAX_QUEUE_SIZE);
  persist();
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); } catch { /* ignore */ }
}

function restore(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) queue = JSON.parse(raw) as AnalyticsEvent[];
  } catch { /* ignore */ }
}

async function flush(): Promise<void> {
  if (!endpoint || queue.length === 0) return;
  const batch = [...queue];
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
    if (resp.ok) {
      queue = queue.filter(e => !batch.includes(e));
      persist();
    }
  } catch { /* retry on next flush */ }
}

export const Analytics = {
  init(config?: { endpoint?: string }): void {
    sessionStart = Date.now();
    sessionId = Math.random().toString(36).slice(2, 10);
    endpoint = config?.endpoint ?? null;
    restore();
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => Analytics.sessionEnd());
    }
    track('session_start', {
      totalGamesPlayed: Save.getStats().totalGamesPlayed,
      playStreak: Save.get().playStreak,
      coins: Save.get().coins,
      totalStars: Save.getAllStars(),
    });
  },

  levelStart(category: Category, level: number): void {
    track('level_start', { category, level });
  },

  levelEnd(data: {
    category: Category;
    level: number;
    won: boolean;
    score: number;
    stars: number;
    combo: number;
    misses: number;
    durationMs: number;
  }): void {
    track('level_end', data);
  },

  adRequested(kind: 'interstitial' | 'rewarded', context: string): void {
    track('ad_requested', { kind, context });
  },

  adCompleted(kind: 'interstitial' | 'rewarded', outcome: AdOutcome): void {
    track('ad_completed', { kind, outcome });
  },

  shopPurchase(item: string, cost: number, type: 'consumable' | 'skin'): void {
    track('shop_purchase', { item, cost, type, coins: Save.get().coins });
  },

  skinEquip(skinId: string): void {
    track('skin_equip', { skinId });
  },

  questClaimed(questId: string, kind: 'daily' | 'weekly'): void {
    track('quest_claimed', { questId, kind });
  },

  categorySelected(category: Category): void {
    track('category_selected', { category });
  },

  sceneView(scene: string): void {
    track('scene_view', { scene });
  },

  sessionEnd(): void {
    track('session_end', { durationMs: Date.now() - sessionStart });
    persist();
  },

  getQueue(): readonly AnalyticsEvent[] {
    return queue;
  },

  getSessionId(): string {
    return sessionId;
  },
};
