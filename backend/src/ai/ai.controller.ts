import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { ChatDto } from './chat.dto';
import { AiMemoryService } from './ai-memory.service';

class CompleteDto {
  @IsString() @MaxLength(6000) prefix: string;
  @IsString() @MaxLength(3000) suffix: string;
  @IsIn(['html', 'css', 'js', 'python']) language: string;
}

const COMPLETE_DAILY = parseInt(process.env.AI_COMPLETE_DAILY_LIMIT ?? '1000', 10);
const completeUsage = new Map<string, { day: string; count: number }>();

const DAILY_LIMIT_FREE = parseInt(process.env.AI_DAILY_LIMIT_FREE ?? '50', 10);
const DAILY_LIMIT_PAID = parseInt(process.env.AI_DAILY_LIMIT_PAID ?? '300', 10);
// In-memory counter: resets on restart; move to Redis/DB if running multiple instances.
const usage = new Map<string, { day: string; count: number }>();

@Controller('ai')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService, private readonly memory: AiMemoryService) {}

  @Get('conversations')
  listConversations(@Req() req: Request) {
    return this.memory.list(Number((req as any).user.sub));
  }

  @Post('conversations')
  createConversation(@Req() req: Request) {
    return this.memory.create(Number((req as any).user.sub));
  }

  @Get('conversations/:id')
  getConversation(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    return this.memory.get(Number((req as any).user.sub), id);
  }

  @Delete('conversations/:id')
  deleteConversation(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    return this.memory.remove(Number((req as any).user.sub), id);
  }

  @Post('chat')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async chat(@Req() req: Request, @Body() dto: ChatDto) {
    const user = (req as any).user;
    const limit = user?.plan && user.plan !== 'free' ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;
    const day = new Date().toISOString().slice(0, 10);
    const key = String(user?.sub);
    const entry = usage.get(key);
    const count = entry && entry.day === day ? entry.count : 0;
    if (count >= limit) {
      throw new HttpException(
        `Daily AI limit reached (${limit} messages). It resets at midnight UTC.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    usage.set(key, { day, count: count + 1 });
    const controller = new AbortController();
    const response = req.res;
    const onClose = () => {
      if (!response?.writableEnded) controller.abort();
    };
    response?.once('close', onClose);
    try {
      return dto.conversationId
        ? await this.memory.chat(Number(user.sub), dto, controller.signal)
        : await this.aiService.chat(dto, controller.signal);
    } finally {
      response?.removeListener('close', onClose);
    }
  }

  @Post('complete')
  @Throttle({ default: { ttl: 60000, limit: 40 } })
  async complete(@Req() req: Request, @Body() dto: CompleteDto) {
    const key = String((req as any).user?.sub);
    const day = new Date().toISOString().slice(0, 10);
    const entry = completeUsage.get(key);
    const count = entry && entry.day === day ? entry.count : 0;
    if (count >= COMPLETE_DAILY) return { completion: '' };
    completeUsage.set(key, { day, count: count + 1 });
    return { completion: await this.aiService.complete(dto.prefix, dto.suffix, dto.language) };
  }
}
