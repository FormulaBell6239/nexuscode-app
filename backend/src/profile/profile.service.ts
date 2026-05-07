import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProgress } from '../entities/UserProgress';
import { AchievementsService } from '../achievements/achievements.service';

/** Safe JSON.parse — returns fallback if the string is null/corrupted */
function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

const XP_PER_LEVEL = 300;
const ENERGY_REGEN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ── Credit economy ─────────────────────────────────────────────────────────
// New lesson completed          → +6
// First-try perfect on lesson   → +3 bonus (total +9)
// Daily first-activity bonus    → +2
// Level up                      → +10
// 7-day streak milestone        → +15
// 30-day streak milestone       → +35
// Game round played (own route) → +3
const CREDITS = {
  newLesson:     6,
  firstTryBonus: 3,
  dailyBonus:    2,
  levelUp:       10,
  streak7:       15,
  streak30:      35,
} as const;

interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  avatar?: string;
  callingCard?: string;
  theme?: string;
}

interface SubmitXpDto {
  amount: number;
  lessonKey?: string;
  firstTry?: boolean;
  gameRound?: boolean; // true when called after a game round
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    private readonly achievementsService: AchievementsService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const progress = await this.progressRepo.findOne({ where: { userId } });
    const completedLessons = progress ? safeParseJSON<string[]>(progress.completedLessons, []) : [];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      callingCard: user.callingCard,
      plan: user.plan,
      theme: user.theme,
      xp: progress?.xp ?? 0,
      level: progress?.level ?? 1,
      streak: progress?.streak ?? 0,
      longestStreak: progress?.longestStreak ?? 0,
      energy: progress?.energy ?? 5,
      maxEnergy: progress?.maxEnergy ?? 5,
      credits: progress?.credits ?? 0,
      completedLessons,
      isGracePeriod: completedLessons.length < 5,
    };
  }

  async addXp(userId: number, dto: SubmitXpDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress) {
      progress = this.progressRepo.create({ userId, energy: 5, maxEnergy: 5, energyLastRegen: new Date() });
    }

    const prevLevel = progress.level;
    progress.xp += dto.amount;
    progress.level = Math.floor(progress.xp / XP_PER_LEVEL) + 1;
    const leveledUp = progress.level > prevLevel;

    // ── Credits earned this call ──────────────────────────────────────────
    let creditsEarned = 0;

    // Streak logic
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = progress.lastActiveDate
      ? new Date(progress.lastActiveDate).toISOString().slice(0, 10)
      : null;

    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastActive === yesterday) {
        progress.streak += 1;
      } else if (lastActive !== today) {
        progress.streak = 1;
      }
      progress.lastActiveDate = new Date();
      if (progress.streak > progress.longestStreak) {
        progress.longestStreak = progress.streak;
      }
      // Daily first-activity bonus
      creditsEarned += CREDITS.dailyBonus;
      // Streak milestone bonuses
      if (progress.streak === 7 || (progress.streak > 7 && progress.streak % 7 === 0)) {
        creditsEarned += CREDITS.streak7;
      }
      if (progress.streak === 30 || (progress.streak > 30 && progress.streak % 30 === 0)) {
        creditsEarned += CREDITS.streak30;
      }
    }

    // Mark lesson complete + award lesson credits
    if (dto.lessonKey) {
      const completed = safeParseJSON<string[]>(progress.completedLessons, []);
      if (!completed.includes(dto.lessonKey)) {
        completed.push(dto.lessonKey);
        progress.completedLessons = JSON.stringify(completed);
        creditsEarned += CREDITS.newLesson;
        if (dto.firstTry) creditsEarned += CREDITS.firstTryBonus;
      }
    }

    // Game round credits
    if (dto.gameRound) {
      creditsEarned += 3;
    }

    // Level up credits
    if (leveledUp) {
      creditsEarned += CREDITS.levelUp * (progress.level - prevLevel);
    }

    progress.credits = (progress.credits ?? 0) + creditsEarned;

    // Energy Sync: +1 for daily activity
    if (lastActive !== today && progress.energy < progress.maxEnergy) {
      progress.energy = Math.min(progress.energy + 1, progress.maxEnergy);
    }

    await this.progressRepo.save(progress);

    // Track XP milestone achievements (fire-and-forget, don't block response)
    this.achievementsService.incrementProgress(userId, 'xp_earned', dto.amount).catch(() => {});

    const completedLessons = safeParseJSON<string[]>(progress.completedLessons, []);
    return {
      xp: progress.xp,
      level: progress.level,
      streak: progress.streak,
      longestStreak: progress.longestStreak,
      energy: progress.energy,
      credits: progress.credits,
      creditsEarned,
      completedLessons,
      isGracePeriod: completedLessons.length < 5,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.callingCard !== undefined) user.callingCard = dto.callingCard;
    if (dto.theme !== undefined) user.theme = dto.theme;

    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      username: saved.username,
      displayName: saved.displayName,
      bio: saved.bio,
      avatar: saved.avatar,
      callingCard: saved.callingCard,
      theme: saved.theme,
    };
  }

  async getHearts(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress) {
      progress = this.progressRepo.create({ userId, energy: 5, maxEnergy: 5, energyLastRegen: new Date(), hearts: 5 });
      await this.progressRepo.save(progress);
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!progress.heartsLastRefilled || progress.heartsLastRefilled < today) {
      progress.hearts = 5;
      progress.heartsLastRefilled = today;
      await this.progressRepo.save(progress);
    }

    return { hearts: progress.hearts, plan: user.plan };
  }

  async deductHeart(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.plan === 'pro') {
      return { hearts: null, pro: true };
    }

    let progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress) {
      progress = this.progressRepo.create({ userId, energy: 5, maxEnergy: 5, energyLastRegen: new Date(), hearts: 5 });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!progress.heartsLastRefilled || progress.heartsLastRefilled < today) {
      progress.hearts = 5;
      progress.heartsLastRefilled = today;
    }

    progress.hearts = Math.max(0, progress.hearts - 1);
    await this.progressRepo.save(progress);

    return { hearts: progress.hearts };
  }
}
