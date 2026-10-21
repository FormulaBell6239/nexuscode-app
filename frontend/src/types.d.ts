declare module '*.css';
declare module '*.module.css';

// ── Shared API types ───────────────────────────────────────────────

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatar: string;
  callingCard: string;
  createdAt: string;
}

interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
}

interface ProfileData {
  user: User;
  progress: UserProgress;
}

interface Game {
  id: number;
  title: string;
  description: string;
  icon: string;
  href: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  genre: 'quiz' | 'debug' | 'speed' | 'logic' | 'build' | 'collab';
  locked: boolean;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  requiredCount: number;
}

interface AchievementEntry extends Achievement {
  progress: number;
  earned: boolean;
  earnedAt: string | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
}
