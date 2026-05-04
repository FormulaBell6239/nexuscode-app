import { Controller, Get, Put, Post, Body, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

// ── Validated DTOs (class-validator runs via global ValidationPipe) ─────────

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(50)
  displayName?: string;

  @IsOptional() @IsString() @MaxLength(500)
  bio?: string;

  @IsOptional() @IsString() @MaxLength(10)
  avatar?: string;

  @IsOptional() @IsString() @MaxLength(50)
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
  submitXp(@Req() req: Request, @Body() body: SubmitXpDto) {
    const userId = (req as any).user.sub;
    return this.profileService.addXp(userId, body);
  }
}
