import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyAchievements(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.achievementsService.getUserAchievements(userId);
  }
}
