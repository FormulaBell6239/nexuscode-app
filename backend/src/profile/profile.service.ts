import { applyEnergyRegen, secondsUntilNextEnergy } from '../energy';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { User } from '../entities/user.entity';
import { UserProgress } from '../entities/UserProgress';
import { UserPurchase } from '../entities/UserPurchase';
import { LESSON_CATALOG, LESSON_REWARDS } from '../lesson-catalog';
import { AchievementsService } from '../achievements/achievements.service';
import { checkLesson } from './lesson-checker';

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
// Daily first-activity bonus    → +2
// Level up                      → +10
// 7-day streak milestone        → +15
// 30-day streak milestone       → +35
// Game round played (own route) → +3
const CREDITS = {
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

const MAX_LESSON_SOURCE_BYTES = 64 * 1024;
const ATTEMPT_TTL_MS = 30 * 60 * 1000;
const ATTEMPT_CLEANUP_BATCH_SIZE = 100;

export function lessonAttemptsEnabled(
  rawEnabled = process.env.LESSON_ATTEMPTS_ENABLED,
  rawSchemaReady = process.env.LESSON_ATTEMPTS_SCHEMA_READY,
): boolean {
  return rawEnabled === 'true' && rawSchemaReady === 'true';
}

function completedLessonList(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((key) => typeof key !== 'string')) throw new Error('Invalid lesson list');
    return parsed;
  } catch {
    throw new InternalServerErrorException('Stored lesson progress is invalid; no progress was changed.');
  }
}

export function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

export function replayCredits(baseCredits: number): number {
  return Math.floor(baseCredits * 0.2 + 0.5);
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
    private readonly dataSource: DataSource,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let progress = await this.progressRepo.findOne({ where: { userId } });
    if (progress) {
      const preview = {
        energy: progress.energy,
        maxEnergy: progress.maxEnergy,
        energyLastRegen: progress.energyLastRegen,
      } as UserProgress;
      if (applyEnergyRegen(preview)) {
        progress = await this.dataSource.transaction(async (manager) => {
          const lockedProgress = await manager.getRepository(UserProgress).findOne({
            where: { userId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!lockedProgress) return null;
          if (applyEnergyRegen(lockedProgress)) {
            await manager.query(
              `UPDATE "user_progress" SET "energy" = $2, "maxEnergy" = $3,
                 "energyLastRegen" = $4, "updatedAt" = now() WHERE "userId" = $1`,
              [userId, lockedProgress.energy, lockedProgress.maxEnergy, lockedProgress.energyLastRegen],
            );
          }
          return lockedProgress;
        });
      }
    }
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

  private assertLessonAttemptsEnabled(): void {
    if (!lessonAttemptsEnabled()) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'LESSON_ATTEMPTS_DISABLED',
        message: 'Lesson attempts are not enabled on this server.',
      });
    }
  }

  async createLessonAttempt(userId: number, lessonKey: string) {
    this.assertLessonAttemptsEnabled();
    if (!Object.prototype.hasOwnProperty.call(LESSON_CATALOG, lessonKey)) {
      throw new NotFoundException('Lesson not found');
    }

    const attemptId = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ATTEMPT_TTL_MS);

    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      await manager.query(
        `DELETE FROM "lesson_attempt"
         WHERE "id" IN (
           SELECT "id" FROM "lesson_attempt"
           WHERE "status" = 'pending' AND "expiresAt" <= now()
           ORDER BY "expiresAt"
           LIMIT $1
           FOR UPDATE SKIP LOCKED
         )`,
        [ATTEMPT_CLEANUP_BATCH_SIZE],
      );
      await manager.query(
        `INSERT INTO "lesson_attempt" ("id", "userId", "lessonKey", "status", "expiresAt", "createdAt")
         VALUES ($1, $2, $3, 'pending', $4, $5)`,
        [attemptId, userId, lessonKey, expiresAt, createdAt],
      );
    });

    return { attemptId, lessonKey, expiresAt: expiresAt.toISOString() };
  }

  async submitLessonAttempt(userId: number, attemptId: string, code: string) {
    this.assertLessonAttemptsEnabled();
    if (hasUnpairedSurrogate(code)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'LESSON_SOURCE_INVALID_UTF16',
        message: 'Lesson source must contain well-formed UTF-16 text.',
      });
    }
    if (Buffer.byteLength(code, 'utf8') > MAX_LESSON_SOURCE_BYTES) {
      throw new PayloadTooLargeException({
        code: 'LESSON_SOURCE_TOO_LARGE',
        message: 'Lesson source must not exceed 64 KiB.',
      });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
      throw new NotFoundException('Lesson attempt not found');
    }

    const sourceHash = createHash('sha256').update(code, 'utf8').digest('hex');
    const outcome = await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      // Lock order: attempt -> user_progress -> user_achievement rows (achievementId ascending)
      // -> per-user prize advisory lock -> user_purchase. Source-attempt reward paths use this order.
      const attemptRows = await manager.query(
        `SELECT "id", "userId", "lessonKey", "status", "sourceHash", "result", "expiresAt"
         FROM "lesson_attempt" WHERE "id" = $1 AND "userId" = $2 FOR UPDATE`,
        [attemptId, userId],
      ) as Array<Record<string, any>>;
      const attempt = attemptRows[0];
      if (!attempt) throw new NotFoundException('Lesson attempt not found');

      if (attempt.status !== 'pending') {
        if (attempt.sourceHash !== sourceHash) {
          throw new ConflictException({
            statusCode: 409,
            code: 'LESSON_ATTEMPT_SOURCE_CONFLICT',
            message: 'This attempt was already submitted with different source.',
          });
        }
        return attempt.result;
      }

      if (new Date(attempt.expiresAt).getTime() <= Date.now()) {
        throw new GoneException({
          statusCode: 410,
          code: 'LESSON_ATTEMPT_EXPIRED',
          message: 'This unused lesson attempt expired. Create a new attempt to continue.',
        });
      }

      const lessonKey = String(attempt.lessonKey);
      const reward = LESSON_REWARDS[lessonKey];
      if (!reward) throw new InternalServerErrorException('Lesson reward catalog is incomplete.');
      const success = checkLesson(lessonKey, code);

      // The unique userId index added by the reviewed migration makes this race-safe.
      await manager.query(
        `INSERT INTO "user_progress" ("userId") VALUES ($1)
         ON CONFLICT ("userId") DO NOTHING`,
        [userId],
      );
      const progressRows = await manager.query(
        `SELECT "xp", "level", "streak", "longestStreak", "lastActiveDate", "energy", "maxEnergy",
                "energyLastRegen", "overclockActiveUntil", "credits", "completedLessons"
         FROM "user_progress" WHERE "userId" = $1 FOR UPDATE`,
        [userId],
      ) as Array<Record<string, any>>;
      const progress = progressRows[0];
      if (!progress) throw new InternalServerErrorException('Could not initialize user progress.');

      const completedLessons = completedLessonList(String(progress.completedLessons));
      if (!success) {
        const result = {
          attemptId,
          lessonKey,
          success: false,
          completionWasFirst: false,
          awardedXp: 0,
          lessonCreditsAwarded: 0,
          bonusCreditsAwarded: 0,
          awardedCredits: 0,
          xp: Number(progress.xp),
          level: Number(progress.level),
          streak: Number(progress.streak),
          longestStreak: Number(progress.longestStreak),
          energy: Number(progress.energy),
          credits: Number(progress.credits),
          completedLessons,
          isGracePeriod: completedLessons.length < 5,
        };
        const finalizedRows = await manager.query(
          `UPDATE "lesson_attempt" SET "status" = 'failed', "sourceHash" = $2,
             "result" = $3::jsonb, "submittedAt" = now()
           WHERE "id" = $1 AND "userId" = $4 AND "status" = 'pending' AND "sourceHash" IS NULL
           RETURNING "id"`,
          [attemptId, sourceHash, JSON.stringify(result), userId],
        );
        if (finalizedRows.length !== 1) {
          throw new ConflictException('Lesson attempt was already finalized.');
        }
        return result;
      }

      const completionWasFirst = !completedLessons.includes(lessonKey);
      if (completionWasFirst) completedLessons.push(lessonKey);
      const awardedXp = completionWasFirst ? reward.xp : 0;
      const lessonCreditsAwarded = completionWasFirst ? reward.baseCredits + reward.sectionClearBonus : 0;

      let firstTry = false;
      if (completionWasFirst) {
        const previousIncorrect = await manager.query(
          `SELECT 1 FROM "lesson_attempt"
           WHERE "userId" = $1 AND "lessonKey" = $2 AND "status" = 'failed'
           LIMIT 1`,
          [userId, lessonKey],
        );
        firstTry = previousIncorrect.length === 0;
      }

      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const lastActiveDate = progress.lastActiveDate ? new Date(progress.lastActiveDate).toISOString().slice(0, 10) : null;
      let streak = Number(progress.streak);
      let longestStreak = Number(progress.longestStreak);
      let lastActive = progress.lastActiveDate ? new Date(progress.lastActiveDate) : null;
      let activityBonusCredits = 0;
      if (completionWasFirst && lastActiveDate !== today) {
        const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
        streak = lastActiveDate === yesterday ? streak + 1 : 1;
        lastActive = now;
        longestStreak = Math.max(longestStreak, streak);
        activityBonusCredits += CREDITS.dailyBonus;
        if (streak === 7 || (streak > 7 && streak % 7 === 0)) activityBonusCredits += CREDITS.streak7;
        if (streak === 30 || (streak > 30 && streak % 30 === 0)) activityBonusCredits += CREDITS.streak30;
      }

      const xp = Number(progress.xp) + awardedXp;
      const level = Math.floor(xp / XP_PER_LEVEL) + 1;
      const levelBonusCredits = completionWasFirst
        ? Math.max(0, level - Number(progress.level)) * CREDITS.levelUp
        : 0;
      const bonusCreditsAwarded = activityBonusCredits + levelBonusCredits;
      const baseAwardedCredits = lessonCreditsAwarded + bonusCreditsAwarded;
      let credits = Number(progress.credits) + baseAwardedCredits;

      const energyState = {
        energy: Number(progress.energy),
        maxEnergy: Number(progress.maxEnergy),
        energyLastRegen: progress.energyLastRegen ? new Date(progress.energyLastRegen) : null,
        overclockActiveUntil: progress.overclockActiveUntil ? new Date(progress.overclockActiveUntil) : null,
      };
      applyEnergyRegen(energyState as UserProgress);

      await manager.query(
        `UPDATE "user_progress" SET "xp" = $2, "level" = $3, "streak" = $4, "longestStreak" = $5,
           "lastActiveDate" = $6, "credits" = $7, "completedLessons" = $8, "energy" = $9,
           "energyLastRegen" = $10, "updatedAt" = now()
         WHERE "userId" = $1`,
        [userId, xp, level, streak, longestStreak, lastActive, credits, JSON.stringify(completedLessons),
          energyState.energy, energyState.energyLastRegen],
      );

      let achievementCreditsAwarded = 0;
      let achievementPrizes: { name: string; icon: string; applyValue: string }[] = [];
      if (completionWasFirst) {
        const events = [{ type: 'xp_earned', by: awardedXp }];
        if (firstTry) events.push({ type: 'first_try_lessons', by: 1 });
        const achievementResult = await this.achievementsService.incrementProgressEventsInTransaction(
          manager,
          userId,
          events,
        );
        achievementCreditsAwarded = achievementResult.creditsAwarded;
        achievementPrizes = achievementResult.prizes;
      }
      credits += achievementCreditsAwarded;
      const awardedCredits = baseAwardedCredits + achievementCreditsAwarded;

      const result = {
        attemptId,
        lessonKey,
        success: true,
        completionWasFirst,
        firstTry: completionWasFirst && firstTry,
        awardedXp,
        lessonCreditsAwarded,
        bonusCreditsAwarded,
        achievementCreditsAwarded,
        achievementPrizes,
        awardedCredits,
        xp,
        level,
        streak,
        longestStreak,
        energy: energyState.energy,
        credits,
        completedLessons,
        isGracePeriod: completedLessons.length < 5,
      };
      const finalizedRows = await manager.query(
        `UPDATE "lesson_attempt" SET "status" = 'succeeded', "sourceHash" = $2,
           "result" = $3::jsonb, "submittedAt" = now()
         WHERE "id" = $1 AND "userId" = $4 AND "status" = 'pending' AND "sourceHash" IS NULL
         RETURNING "id"`,
        [attemptId, sourceHash, JSON.stringify(result), userId],
      );
      if (finalizedRows.length !== 1) {
        throw new ConflictException('Lesson attempt was already finalized.');
      }
      return result;
    });
    return outcome;
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

  private async lockOrCreateProgress(manager: EntityManager, userId: number) {
    await manager.query(
      `INSERT INTO "user_progress" ("userId", "energy", "maxEnergy", "energyLastRegen")
       VALUES ($1, 10, 10, now()) ON CONFLICT ("userId") DO NOTHING`,
      [userId],
    );
    const progress = await manager.getRepository(UserProgress).findOne({
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!progress) throw new InternalServerErrorException('Could not initialize user progress.');
    return progress;
  }

  private async persistEnergy(manager: EntityManager, userId: number, progress: UserProgress) {
    await manager.query(
      `UPDATE "user_progress" SET "energy" = $2, "maxEnergy" = $3,
         "energyLastRegen" = $4, "updatedAt" = now() WHERE "userId" = $1`,
      [userId, progress.energy, progress.maxEnergy, progress.energyLastRegen],
    );
  }

  async getHearts(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const progress = await this.dataSource.transaction(async (manager) => {
      const lockedProgress = await this.lockOrCreateProgress(manager, userId);
      applyEnergyRegen(lockedProgress);
      await this.persistEnergy(manager, userId, lockedProgress);
      return lockedProgress;
    });
    return {
      hearts: progress.energy,
      maxHearts: progress.maxEnergy,
      nextInSeconds: secondsUntilNextEnergy(progress),
      plan: user.plan,
    };
  }

  async deductHeart(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.plan === 'pro') {
      return { hearts: null, pro: true };
    }

    const progress = await this.dataSource.transaction(async (manager) => {
      const lockedProgress = await this.lockOrCreateProgress(manager, userId);
      applyEnergyRegen(lockedProgress);
      if (lockedProgress.energy >= lockedProgress.maxEnergy) lockedProgress.energyLastRegen = new Date();
      lockedProgress.energy = Math.max(0, lockedProgress.energy - 1);
      await this.persistEnergy(manager, userId, lockedProgress);
      return lockedProgress;
    });

    return {
      hearts: progress.energy,
      maxHearts: progress.maxEnergy,
      nextInSeconds: secondsUntilNextEnergy(progress),
    };
  }
}
