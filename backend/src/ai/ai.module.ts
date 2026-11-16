import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from '../entities/AiConversation';
import { AiMessage } from '../entities/AiMessage';
import { AiMemoryService } from './ai-memory.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([AiConversation, AiMessage])],
  controllers: [AiController],
  providers: [AiService, AiMemoryService],
})
export class AiModule {}
