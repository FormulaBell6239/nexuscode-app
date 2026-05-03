import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/Achievement';
import { UserAchievement } from '../entities/UserAchievement';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
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
        progress: ua?.progress ?? 0,
        earned: ua?.earned ?? false,
        earnedAt: ua?.earnedAt ?? null,
      };
    });
  }
}
