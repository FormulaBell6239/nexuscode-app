import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Achievement } from '../entities/Achievement';
import { UserAchievement } from '../entities/UserAchievement';
import { StoreService } from '../store/store.service';
import { EMBLEM_REWARDS } from '../emblem-rewards';

// Maps a credit reward amount to the tier skin applyValue
function tierSkinForReward(creditReward: number): string {
  if (creditReward <= 15) return 'ember';
  if (creditReward <= 50) return 'matrix-green';
  return 'solar';
}

export interface IncrementResult {
  creditsAwarded: number;
  prizes: { name: string; icon: string; applyValue: string }[];
}

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    private readonly storeService: StoreService,
    private readonly dataSource: DataSource,
  ) {}

  async getAllAchievements() {
    const all = await this.achievementRepo.find();
    return all.map((a) => ({
      ...a,
      emblemId: EMBLEM_REWARDS[a.name] ?? null,
      themeReward: tierSkinForReward(a.creditReward),
      avatarReward: a.name === 'Unstoppable' ? 'avatar-unbroken' : null,
    }));
  }

  async getUserAchievements(userId: number) {
    const all = await this.achievementRepo.find();
    const userProgress = await this.userAchievementRepo.find({ where: { userId } });

    const progressMap = new Map(userProgress.map((ua) => [ua.achievementId, ua]));

    // Backfill emblems for achievements earned before emblems existed (idempotent)
    for (const a of all) {
      const emblemId = EMBLEM_REWARDS[a.name];
      if (emblemId && progressMap.get(a.id)?.earned) {
        await this.storeService.grantPrizeSkin(userId, emblemId).catch(() => null);
      }
    }

    return all.map((a) => {
      const ua = progressMap.get(a.id);
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        type: a.type,
        requiredCount: a.requiredCount,
        creditReward: a.creditReward,
        emblemId: EMBLEM_REWARDS[a.name] ?? null,
        themeReward: tierSkinForReward(a.creditReward),
        avatarReward: a.name === 'Unstoppable' ? 'avatar-unbroken' : null,
        progress: ua?.progress ?? 0,
        earned: ua?.earned ?? false,
        earnedAt: ua?.earnedAt ?? null,
      };
    });
  }

  /**
   * Increment progress toward an achievement type for a user.
   * Awards credits and auto-grants the matching tier skin when a badge is first earned.
   */
  async incrementProgress(userId: number, type: string, by = 1): Promise<IncrementResult> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO "user_progress" ("userId") VALUES ($1)
         ON CONFLICT ("userId") DO NOTHING`,
        [userId],
      );
      await manager.query(
        `SELECT "userId" FROM "user_progress" WHERE "userId" = $1 FOR UPDATE`,
        [userId],
      );
      return this.incrementProgressEventsInTransaction(manager, userId, [{ type, by }]);
    });
  }

  /**
   * Source-attempt variant. The caller must already hold the user's
   * user_progress row lock and must keep this EntityManager in the same
   * transaction through attempt finalization.
   */
  async incrementProgressInTransaction(
    manager: EntityManager,
    userId: number,
    type: string,
    by = 1,
  ): Promise<IncrementResult> {
    return this.incrementProgressEventsInTransaction(manager, userId, [{ type, by }]);
  }

  async incrementProgressEventsInTransaction(
    manager: EntityManager,
    userId: number,
    events: Array<{ type: string; by: number }>,
  ): Promise<IncrementResult> {
    const byType = new Map<string, number>();
    for (const event of events) byType.set(event.type, (byType.get(event.type) ?? 0) + event.by);
    const matching = await Promise.all(Array.from(byType.keys()).map(async (type) => ({
      type,
      achievements: await manager.getRepository(Achievement).find({ where: { type } }),
    })));
    const achievements = matching
      .flatMap(({ type, achievements: rows }) => rows.map((achievement) => ({
        achievement,
        by: byType.get(type) ?? 0,
      })))
      .sort((a, b) => a.achievement.id - b.achievement.id);
    const userAchievementRepo = manager.getRepository(UserAchievement);
    let creditsAwarded = 0;
    const prizes: IncrementResult['prizes'] = [];

    for (const { achievement, by } of achievements) {
      // user_progress is locked by the caller, so concurrent source attempts
      // for this user serialize even when the achievement row does not exist yet.
      const userAchievement = await userAchievementRepo.findOne({
        where: { userId, achievementId: achievement.id },
        lock: { mode: 'pessimistic_write' },
      });
      const record = userAchievement ?? userAchievementRepo.create({
        userId,
        achievementId: achievement.id,
        progress: 0,
        earned: false,
        earnedAt: null,
      });
      if (record.earned) continue;

      record.progress = Math.min(record.progress + by, achievement.requiredCount);
      const newlyEarned = record.progress >= achievement.requiredCount;
      if (newlyEarned) {
        record.earned = true;
        record.earnedAt = new Date();
      }
      await userAchievementRepo.save(record);

      if (!newlyEarned) continue;

      if (achievement.creditReward > 0) {
        const updated = await manager.query(
          `UPDATE "user_progress" SET "credits" = COALESCE("credits", 0) + $2
           WHERE "userId" = $1 RETURNING "userId"`,
          [userId, achievement.creditReward],
        );
        if (updated.length !== 1) {
          throw new Error('Could not apply achievement credit reward.');
        }
        creditsAwarded += achievement.creditReward;
      }

      const skin = await this.storeService.grantPrizeSkinInTransaction(
        manager,
        userId,
        tierSkinForReward(achievement.creditReward),
      );
      if (skin) prizes.push(skin);

      const emblemId = EMBLEM_REWARDS[achievement.name];
      if (emblemId) {
        const emblem = await this.storeService.grantPrizeSkinInTransaction(manager, userId, emblemId);
        if (emblem) prizes.push(emblem);
      }

      if (achievement.name === 'Unstoppable') {
        const avatar = await this.storeService.grantPrizeSkinInTransaction(manager, userId, 'avatar-unbroken');
        if (avatar) prizes.push(avatar);
      }
    }

    return { creditsAwarded, prizes };
  }
}
