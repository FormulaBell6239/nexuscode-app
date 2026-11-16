import { Controller, Get, Put, Post, Body, Req, UseGuards, Param, GoneException } from '@nestjs/common';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
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

class CreateLessonAttemptDto {
  @IsString() @MaxLength(200)
  lessonKey: string;
}

class SubmitLessonAttemptDto {
  @IsString()
  code: string;
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
  submitXp() {
    throw new GoneException({
      statusCode: 410,
      code: 'XP_ENDPOINT_RETIRED',
      message: 'Client-authorized XP submissions are no longer supported.',
    });
  }

  @Post('lesson-attempts')
  createLessonAttempt(@Req() req: Request, @Body() body: CreateLessonAttemptDto) {
    const userId = (req as any).user.sub;
    return this.profileService.createLessonAttempt(userId, body.lessonKey);
  }

  @Post('lesson-attempts/:attemptId/submit')
  submitLessonAttempt(
    @Req() req: Request,
    @Param('attemptId') attemptId: string,
    @Body() body: SubmitLessonAttemptDto,
  ) {
    const userId = (req as any).user.sub;
    return this.profileService.submitLessonAttempt(userId, attemptId, body.code);
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
