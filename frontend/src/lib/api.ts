const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Typed helpers ──────────────────────────────────────────────────────────

export interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  callingCard: string | null;
  plan: string;
  theme: string;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  energy: number;
  maxEnergy: number;
  credits: number;
  completedLessons: string[];
  isGracePeriod: boolean;
}

export interface XpResponse {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  energy: number;
  credits: number;
  creditsEarned: number;
  completedLessons: string[];
  isGracePeriod: boolean;
}

export const getProfile = () => api.get<ProfileResponse>('/api/profile');

export const submitXp = (amount: number, lessonKey?: string, firstTry?: boolean, gameRound?: boolean) =>
  api.post<XpResponse>('/api/profile/xp', { amount, lessonKey, firstTry, gameRound });

export interface HeartsResponse {
  hearts: number;
  plan: string;
}

export interface DeductHeartResponse {
  hearts: number | null;
  pro?: boolean;
}

export const getHearts = () => api.get<HeartsResponse>('/api/profile/hearts');
export const deductHeart = () => api.post<DeductHeartResponse>('/api/profile/hearts/deduct');

export interface OwnedItem {
  itemId: number;
  name: string;
  category: string;
  cosmeticType: string | null;
  applyValue: string | null;
  gameSlug: string | null;
  isPrize: boolean;
  purchasedAt: string;
}

export const getOwnedItems = () => api.get<OwnedItem[]>('/api/store/owned');

// ── Offline / local credits ─────────────────────────────────────────────────
// Mirrors the server-side CREDITS constants so offline users earn at the same rate.
const LOCAL_CREDITS_KEY   = 'nexus_local_credits';
const LOCAL_OWNED_KEY     = 'nexus_local_owned';
const LOCAL_COMPLETED_KEY = 'nexus_local_completed';

export const LOCAL_CREDIT_RATES = {
  newLesson:     6,
  firstTryBonus: 3,
  dailyBonus:    2,
  levelUp:       10,
  gameRound:     3,
} as const;

/** Credits awarded for a PERFECT (zero-mistake) game session, keyed by difficulty. */
export const GAME_CREDITS = {
  Easy:   2,
  Medium: 6,
  Hard:   10,
} as const;

export function getLocalCredits(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(LOCAL_CREDITS_KEY) ?? '0', 10);
}

export function addLocalCredits(amount: number): number {
  const next = getLocalCredits() + amount;
  localStorage.setItem(LOCAL_CREDITS_KEY, String(next));
  return next;
}

export function spendLocalCredits(amount: number): boolean {
  const current = getLocalCredits();
  if (current < amount) return false;
  localStorage.setItem(LOCAL_CREDITS_KEY, String(current - amount));
  return true;
}

export function getLocalOwnedIds(): number[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_OWNED_KEY) ?? '[]'); }
  catch { return []; }
}

export function addLocalOwnedId(id: number): void {
  const ids = getLocalOwnedIds();
  if (!ids.includes(id)) {
    localStorage.setItem(LOCAL_OWNED_KEY, JSON.stringify([...ids, id]));
  }
}

export function getLocalCompletedLessons(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_COMPLETED_KEY) ?? '[]'); }
  catch { return []; }
}

/** Marks a lesson complete locally. Returns true if it was new (credits should be awarded). */
export function addLocalCompletedLesson(key: string): boolean {
  const completed = getLocalCompletedLessons();
  if (completed.includes(key)) return false;
  localStorage.setItem(LOCAL_COMPLETED_KEY, JSON.stringify([...completed, key]));
  return true;
}
