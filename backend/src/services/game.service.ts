import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Game } from '../entities/Game';
import { UserPurchase } from '../entities/UserPurchase';
import { StoreItem } from '../entities/StoreItem';
import { AchievementsService } from '../achievements/achievements.service';

const XP_PER_GAME = 100;

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(StoreItem)
    private readonly storeItemRepo: Repository<StoreItem>,
    private readonly achievementsService: AchievementsService,
    private readonly dataSource: DataSource,
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

    const gameProgress = await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO "user_progress" ("userId") VALUES ($1)
         ON CONFLICT ("userId") DO NOTHING`,
        [userId],
      );
      const rows = await manager.query(
        `SELECT "xp" FROM "user_progress" WHERE "userId" = $1 FOR UPDATE`,
        [userId],
      ) as Array<{ xp: number }>;
      const xp = Number(rows[0]?.xp ?? 0) + XP_PER_GAME;
      const level = Math.floor(xp / 300) + 1;
      const lastActiveDate = new Date();
      await manager.query(
        `UPDATE "user_progress" SET "xp" = $2, "level" = $3, "lastActiveDate" = $4,
           "updatedAt" = now() WHERE "userId" = $1`,
        [userId, xp, level, lastActiveDate],
      );
      return { xp, level };
    });

    const r1 = await this.achievementsService.incrementProgress(userId, 'challenges_completed', 1);
    const r2 = await this.achievementsService.incrementProgress(userId, 'targets_hit', 1);
    let creditsAwarded = r1.creditsAwarded + r2.creditsAwarded;
    const prizes = [...r1.prizes, ...r2.prizes];
    if (gameProgress.level >= 5) {
      const r3 = await this.achievementsService.incrementProgress(userId, 'overall_performance', 1);
      creditsAwarded += r3.creditsAwarded;
      prizes.push(...r3.prizes);
    }
    return { xp: gameProgress.xp, level: gameProgress.level, creditsAwarded, prizes };
  }
}
