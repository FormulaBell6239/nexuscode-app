import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Game } from './entities/Game';
import { Achievement } from './entities/Achievement';
import { UserProgress } from './entities/UserProgress';
import { UserAchievement } from './entities/UserAchievement';
import { StoreItem } from './entities/StoreItem';
import { UserPurchase } from './entities/UserPurchase';
import { CommunityPost } from './entities/CommunityPost';
import { CommunityReply } from './entities/CommunityReply';
import { CommunityVote } from './entities/CommunityVote';
import { CommunityReport } from './entities/CommunityReport';
import { Feedback } from './entities/Feedback';
import { CommunityNotification } from './entities/CommunityNotification';

dotenv.config();

// Used by the TypeORM CLI (migration:generate / migration:run).
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME ?? 'nexuscode',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: [User, Game, Achievement, UserProgress, UserAchievement, StoreItem, UserPurchase, CommunityPost, CommunityReply, CommunityVote, CommunityReport, CommunityNotification, Feedback],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
