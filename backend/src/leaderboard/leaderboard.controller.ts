import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

const MAX_LEADERBOARD_LIMIT = 100;

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 10;
    const clamped = Number.isNaN(parsed) ? 10 : Math.min(Math.max(parsed, 1), MAX_LEADERBOARD_LIMIT);
    return this.leaderboardService.getLeaderboard(clamped);
  }
}
