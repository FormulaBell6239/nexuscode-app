import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/Game';
import { UserProgress } from '../entities/UserProgress';
import { UserAchievement } from '../entities/UserAchievement';
import { Achievement } from '../entities/Achievement';

const XP_PER_GAME = 100;

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
  ) {}

  findAllGames() {
    return this.gameRepo.find({ order: { genre: 'ASC', id: 'ASC' } });
  }

  findByGenre(genre: string) {
    return this.gameRepo.find({ where: { genre: genre as any }, order: { id: 'ASC' } });
  }

  async completeGame(gameId: number, userId: number) {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');

    let progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress) {
      progress = this.progressRepo.create({ userId });
    }

    progress.xp += XP_PER_GAME;
    progress.level = Math.floor(progress.xp / 300) + 1;
    progress.lastActiveDate = new Date();
    await this.progressRepo.save(progress);

    const unlocked = await this.checkAchievements(userId, progress);
    return { xp: progress.xp, level: progress.level, unlockedAchievements: unlocked };
  }

  private async checkAchievements(userId: number, progress: UserProgress) {
    const allAchievements = await this.achievementRepo.find();
    const unlocked: Achievement[] = [];
    const gamesCompleted = Math.floor(progress.xp / XP_PER_GAME);

    for (const achievement of allAchievements) {
      let progressCount = 0;
      if (achievement.type === 'challenges_completed') progressCount = gamesCompleted;
      if (achievement.type === 'targets_hit') progressCount = gamesCompleted;
      if (achievement.type === 'overall_performance') progressCount = progress.level >= 5 ? 1 : 0;

      let ua = await this.userAchievementRepo.findOne({
        where: { userId, achievementId: achievement.id },
      });
      if (!ua) {
        ua = this.userAchievementRepo.create({ userId, achievementId: achievement.id });
      }

      const wasEarned = ua.earned;
      ua.progress = Math.min(progressCount, achievement.requiredCount);
      if (!wasEarned && progressCount >= achievement.requiredCount) {
        ua.earned = true;
        ua.earnedAt = new Date();
        unlocked.push(achievement);
      }
      await this.userAchievementRepo.save(ua);
    }

    return unlocked;
  }
}