import { Body, Controller, Get, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { Feedback } from '../entities/Feedback';
import { User } from '../entities/user.entity';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../guards/jwt-auth.guard';

class FeedbackDto {
  @IsIn(['bug', 'idea', 'other'])
  category: 'bug' | 'idea' | 'other';

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  page?: string;
}

@Controller('feedback')
export class FeedbackController {
  constructor(
    @InjectRepository(Feedback) private readonly repo: Repository<Feedback>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @Post()
  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 3600000, limit: 10 } })
  async submit(@Req() req: Request, @Body() dto: FeedbackDto) {
    await this.repo.save(
      this.repo.create({
        userId: (req as any).user?.sub ?? null,
        category: dto.category,
        message: dto.message,
        page: dto.page ?? null,
        userAgent: (req.headers['user-agent'] ?? '').slice(0, 300) || null,
      }),
    );
    return { ok: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: Request) {
    const me = await this.users.findOne({ where: { id: (req as any).user.sub } });
    if (me?.role !== 'admin') throw new ForbiddenException();
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
