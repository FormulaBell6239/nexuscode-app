import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from '../controllers/game.controller';
import { GameService } from '../services/game.service';
import { Game } from '../entities/Game';
import { UserProgress } from '../entities/UserProgress';
import { UserAchievement } from '../entities/UserAchievement';
import { Achievement } from '../entities/Achievement';
import { UserPurchase } from '../entities/UserPurchase';
import { StoreItem } from '../entities/StoreItem';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, UserProgress, UserAchievement, Achievement, UserPurchase, StoreItem]),
    AuthModule,
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
