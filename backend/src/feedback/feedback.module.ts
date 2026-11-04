import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Feedback } from '../entities/Feedback';
import { User } from '../entities/user.entity';
import { FeedbackController } from './feedback.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Feedback, User])],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
