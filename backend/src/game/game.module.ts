import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from '../controllers/game.controller';
import { GameService } from '../services/game.service';
import { Game } from '../entities/Game';
import { UserProgress } from '../entities/UserProgress';
import { UserPurchase } from '../entities/UserPurchase';
import { StoreItem } from '../entities/StoreItem';
import { AuthModule } from '../auth/auth.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, UserProgress, UserPurchase, StoreItem]),
    AuthModule,
    AchievementsModule,
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
