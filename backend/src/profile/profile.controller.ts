import { Controller, Get, Put, Post, Body, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

// ── Validated DTOs (class-validator runs via global ValidationPipe) ─────────

const CALLING_CARD_PATTERN = /^(?:indigo|cyber|ocean|neon|night|jade|rose|volt|chrome|fuchsia|aurora|glacier|crimson|citron|tidal|flare|orchid|arctic|inferno|iris|custom-[0-9a-fA-F]{6}-[0-9a-fA-F]{6})$/;

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(50)
  displayName?: string;

  @IsOptional() @IsString() @MaxLength(500)
  bio?: string;

  @IsOptional() @IsString() @MaxLength(80)
  avatar?: string;

  @IsOptional() @IsString() @Matches(CALLING_CARD_PATTERN)
  callingCard?: string;

  @IsOptional() @IsString() @MaxLength(50)
  theme?: string;
}

class SubmitXpDto {
  /** Capped at 500 server-side — prevents economy exploits via large amounts */
  @IsInt() @Min(0) @Max(500)
  amount: number;

  @IsOptional() @IsString() @MaxLength(200)
  lessonKey?: string;

  @IsOptional() @IsBoolean()
  firstTry?: boolean;

  @IsOptional() @IsInt() @Min(0) @Max(200)
  lessonIndex?: number;

  @IsOptional() @IsInt() @Min(1) @Max(200)
  lessonTotal?: number;

  @IsOptional() @IsBoolean()
  gameRound?: boolean;
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.profileService.getProfile(userId);
  }

  @Put()
  updateProfile(@Req() req: Request, @Body() body: UpdateProfileDto) {
    const userId = (req as any).user.sub;
    return this.profileService.updateProfile(userId, body);
  }

  @Post('xp')
  // Max 4 XP submissions per minute — prevents credit farming via rapid gameRound calls
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 4 } })
  submitXp(@Req() req: Request, @Body() body: SubmitXpDto) {
    const userId = (req as any).user.sub;
    return this.profileService.addXp(userId, body);
  }

  @Get('hearts')
  getHearts(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.profileService.getHearts(userId);
  }

  @Post('hearts/deduct')
  deductHeart(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.profileService.deductHeart(userId);
  }
}
