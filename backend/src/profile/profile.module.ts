import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from '../entities/user.entity';
import { UserProgress } from '../entities/UserProgress';
import { AuthModule } from '../auth/auth.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProgress]), AuthModule, AchievementsModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
