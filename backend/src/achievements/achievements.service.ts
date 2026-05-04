import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/Achievement';
import { UserAchievement } from '../entities/UserAchievement';
import { UserProgress } from '../entities/UserProgress';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  getAllAchievements() {
    return this.achievementRepo.find();
  }

  async getUserAchievements(userId: number) {
    const all = await this.achievementRepo.find();
    const userProgress = await this.userAchievementRepo.find({ where: { userId } });

    const progressMap = new Map(userProgress.map((ua) => [ua.achievementId, ua]));

    return all.map((a) => {
      const ua = progressMap.get(a.id);
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        requiredCount: a.requiredCount,
        creditReward: a.creditReward,
        progress: ua?.progress ?? 0,
        earned: ua?.earned ?? false,
        earnedAt: ua?.earnedAt ?? null,
      };
    });
  }

  /**
   * Increment progress toward an achievement type for a user.
   * If the achievement is newly completed, credits are awarded.
   * Returns the credit amount awarded (0 if nothing new earned).
   */
  async incrementProgress(userId: number, type: string, by = 1): Promise<number> {
    const achievements = await this.achievementRepo.find({ where: { type } });
    let totalCreditsAwarded = 0;

    for (const ach of achievements) {
      let ua = await this.userAchievementRepo.findOne({
        where: { userId, achievementId: ach.id },
      });

      if (!ua) {
        ua = this.userAchievementRepo.create({
          userId,
          achievementId: ach.id,
          progress: 0,
          earned: false,
          earnedAt: null,
        });
      }

      if (ua.earned) continue; // already done, skip

      ua.progress = Math.min(ua.progress + by, ach.requiredCount);

      if (ua.progress >= ach.requiredCount) {
        ua.earned = true;
        ua.earnedAt = new Date();

        // Award credits
        if (ach.creditReward > 0) {
          const progress = await this.progressRepo.findOne({ where: { userId } });
          if (progress) {
            progress.credits = (progress.credits ?? 0) + ach.creditReward;
            await this.progressRepo.save(progress);
            totalCreditsAwarded += ach.creditReward;
          }
        }
      }

      await this.userAchievementRepo.save(ua);
    }

    return totalCreditsAwarded;
  }
}
