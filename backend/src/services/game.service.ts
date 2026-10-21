import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/Game';
import { UserProgress } from '../entities/UserProgress';
import { UserPurchase } from '../entities/UserPurchase';
import { StoreItem } from '../entities/StoreItem';
import { AchievementsService } from '../achievements/achievements.service';

const XP_PER_GAME = 100;

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(StoreItem)
    private readonly storeItemRepo: Repository<StoreItem>,
    private readonly achievementsService: AchievementsService,
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

    // Access control: locked games require a matching store purchase
    if (game.locked && game.slug) {
      const storeItem = await this.storeItemRepo.findOne({ where: { gameSlug: game.slug } });
      if (storeItem) {
        const purchase = await this.purchaseRepo.findOne({
          where: { userId, itemId: storeItem.id },
        });
        if (!purchase) {
          throw new ForbiddenException('You do not own this game');
        }
      }
    }

    let progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress) {
      progress = this.progressRepo.create({ userId });
    }

    progress.xp += XP_PER_GAME;
    progress.level = Math.floor(progress.xp / 300) + 1;
    progress.lastActiveDate = new Date();
    await this.progressRepo.save(progress);

    const r1 = await this.achievementsService.incrementProgress(userId, 'challenges_completed', 1);
    const r2 = await this.achievementsService.incrementProgress(userId, 'targets_hit', 1);
    let creditsAwarded = r1.creditsAwarded + r2.creditsAwarded;
    const prizes = [...r1.prizes, ...r2.prizes];
    if (progress.level >= 5) {
      const r3 = await this.achievementsService.incrementProgress(userId, 'overall_performance', 1);
      creditsAwarded += r3.creditsAwarded;
      prizes.push(...r3.prizes);
    }
    return { xp: progress.xp, level: progress.level, creditsAwarded, prizes };
  }
}