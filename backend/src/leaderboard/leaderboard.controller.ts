import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getLeaderboard(limit ? parseInt(limit, 10) : 10);
  }
}
