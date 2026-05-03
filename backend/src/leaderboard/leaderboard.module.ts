import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { UserProgress } from '../entities/UserProgress';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProgress, User])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
