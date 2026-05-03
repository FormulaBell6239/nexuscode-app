import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { Achievement } from '../entities/Achievement';
import { UserAchievement } from '../entities/UserAchievement';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, UserAchievement]), AuthModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
