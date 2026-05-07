import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/Achievement';
import { UserAchievement } from '../entities/UserAchievement';
import { UserProgress } from '../entities/UserProgress';
import { StoreService } from '../store/store.service';

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
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    private readonly storeService: StoreService,
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
        type: a.type,
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
   * Awards credits and auto-grants the matching tier skin when a badge is first earned.
   */
  async incrementProgress(userId: number, type: string, by = 1): Promise<IncrementResult> {
    const achievements = await this.achievementRepo.find({ where: { type } });
    let creditsAwarded = 0;
    const prizes: IncrementResult['prizes'] = [];

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

      if (ua.earned) continue;

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
            creditsAwarded += ach.creditReward;
          }
        }

        // Auto-grant tier skin (first badge of that tier unlocks it)
        const skinSlug = tierSkinForReward(ach.creditReward);
        const prize = await this.storeService.grantPrizeSkin(userId, skinSlug).catch(() => null);
        if (prize) prizes.push(prize);
      }

      await this.userAchievementRepo.save(ua);
    }

    return { creditsAwarded, prizes };
  }
}

