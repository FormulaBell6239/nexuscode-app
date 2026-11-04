import { Body, Controller, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { ChatDto } from './chat.dto';

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
  constructor(private readonly aiService: AiService) {}

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
    return this.aiService.chat(dto);
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
