import { applyEnergyRegen, secondsUntilNextEnergy } from '../energy';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProgress } from '../entities/UserProgress';
import { UserPurchase } from '../entities/UserPurchase';
import { LESSON_CATALOG } from '../lesson-catalog';
import { AchievementsService } from '../achievements/achievements.service';

/** Safe JSON.parse — returns fallback if the string is null/corrupted */
function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

const XP_PER_LEVEL = 300;
const STARTER_AVATARS = ['👾', '🤖', '🦾', '💀', '⚡', '🔮', '🪐', '🎮', '👽', '👻', '🦊', '🐙', '🦈', '🦉', '🐉', '🐺', '🐱', '🐸', '🦄', '🐼', '🐧', '🦋', '🦖', '🥷', '🧑‍🚀', '🧙', '🦇', '🦂', '🌙', '💎'];

// ── Credit economy ─────────────────────────────────────────────────────────
// New lesson completed          → +3 (first third) / +4 (middle) / +5 (last third)
// Last lesson of a section      → +10 section-clear bonus
// First-try perfect on lesson   → +2 bonus
// Daily first-activity bonus    → +2
// Level up                      → +10
// 7-day streak milestone        → +15
// 30-day streak milestone       → +35
// Game round played (own route) → +3
const CREDITS = {
  firstTryBonus: 2,
  sectionClear:  10,
  dailyBonus:    2,
  levelUp:       10,
  streak7:       15,
  streak30:      35,
} as const;

export function lessonCredits(index?: number, total?: number): number {
  const t = Math.max(1, Math.min(total ?? 1, 200));
  const i = Math.max(0, Math.min(index ?? 0, t - 1));
  const base = i < t / 3 ? 3 : i < (2 * t) / 3 ? 4 : 5;
  return base + (total && i === t - 1 ? CREDITS.sectionClear : 0);
}

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
  lessonIndex?: number;
  lessonTotal?: number;
  gameRound?: boolean; // true when called after a game round
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    private readonly achievementsService: AchievementsService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const progress = await this.progressRepo.findOne({ where: { userId } });
    if (progress && applyEnergyRegen(progress)) await this.progressRepo.save(progress);
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
      energy: progress?.energy ?? 10,
      maxEnergy: progress?.maxEnergy ?? 10,
      credits: progress?.credits ?? 0,
      completedLessons,
      isGracePeriod: completedLessons.length < 5,
    };
  }

  async addXp(userId: number, dto: SubmitXpDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const progress = await this.findOrCreateProgress(userId);

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
    // Only real lessons count; position and section length come from the server catalog
    const lessonInfo = dto.lessonKey && Object.prototype.hasOwnProperty.call(LESSON_CATALOG, dto.lessonKey) ? LESSON_CATALOG[dto.lessonKey] : undefined;
    if (dto.lessonKey && lessonInfo) {
      const completed = safeParseJSON<string[]>(progress.completedLessons, []);
      if (!completed.includes(dto.lessonKey)) {
        completed.push(dto.lessonKey);
        progress.completedLessons = JSON.stringify(completed);
        creditsEarned += lessonCredits(lessonInfo[0], lessonInfo[1]);
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

    applyEnergyRegen(progress);

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

    if (dto.avatar !== undefined && !STARTER_AVATARS.includes(dto.avatar)) {
      const ownedAvatar = await this.purchaseRepo.findOne({
        where: {
          userId,
          item: { category: 'cosmetic', cosmeticType: 'avatar', applyValue: dto.avatar },
        },
      });
      if (!ownedAvatar) throw new ForbiddenException('You do not own this avatar');
    }

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

  private async findOrCreateProgress(userId: number) {
    const existing = await this.progressRepo.findOne({ where: { userId } });
    return existing ?? this.progressRepo.create({ userId, energy: 10, maxEnergy: 10, energyLastRegen: new Date() });
  }

  private async loadEnergy(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const progress = await this.findOrCreateProgress(userId);
    applyEnergyRegen(progress);
    return { user, progress };
  }

  async getHearts(userId: number) {
    const { user, progress } = await this.loadEnergy(userId);
    await this.progressRepo.save(progress);
    return {
      hearts: progress.energy,
      maxHearts: progress.maxEnergy,
      nextInSeconds: secondsUntilNextEnergy(progress),
      plan: user.plan,
    };
  }

  async deductHeart(userId: number) {
    const { user, progress } = await this.loadEnergy(userId);
    if (user.plan === 'pro') {
      return { hearts: null, pro: true };
    }

    if (progress.energy >= progress.maxEnergy) progress.energyLastRegen = new Date();
    progress.energy = Math.max(0, progress.energy - 1);
    await this.progressRepo.save(progress);

    return {
      hearts: progress.energy,
      maxHearts: progress.maxEnergy,
      nextInSeconds: secondsUntilNextEnergy(progress),
    };
  }
}
