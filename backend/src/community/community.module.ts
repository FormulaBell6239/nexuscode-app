import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { CommunityPost } from '../entities/CommunityPost';
import { CommunityReply } from '../entities/CommunityReply';
import { CommunityVote } from '../entities/CommunityVote';
import { CommunityReport } from '../entities/CommunityReport';
import { CommunityNotification } from '../entities/CommunityNotification';
import { AuthModule } from '../auth/auth.module';
import { OptionalJwtAuthGuard } from '../guards/jwt-auth.guard';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CommunityPost, CommunityReply, CommunityVote, CommunityReport, CommunityNotification]),
    AuthModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService, OptionalJwtAuthGuard],
})
export class CommunityModule {}
