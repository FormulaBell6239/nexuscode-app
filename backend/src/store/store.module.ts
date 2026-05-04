import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreItem } from '../entities/StoreItem';
import { UserPurchase } from '../entities/UserPurchase';
import { UserProgress } from '../entities/UserProgress';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreItem, UserPurchase, UserProgress, User]),
    AuthModule,
  ],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
