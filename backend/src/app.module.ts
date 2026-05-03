import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { ProfileModule } from './profile/profile.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AchievementsModule } from './achievements/achievements.module';
import { User } from './entities/user.entity';
import { Game } from './entities/Game';
import { Achievement } from './entities/Achievement';
import { UserProgress } from './entities/UserProgress';
import { UserAchievement } from './entities/UserAchievement';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'nexuscode'),
        entities: [User, Game, Achievement, UserProgress, UserAchievement],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    GameModule,
    ProfileModule,
    LeaderboardModule,
    AchievementsModule,
  ],
})
export class AppModule {}