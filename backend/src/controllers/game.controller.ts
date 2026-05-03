import { Controller, Get, Post, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { GameService } from '../services/game.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  getGames(@Query('genre') genre?: string) {
    if (genre) return this.gameService.findByGenre(genre);
    return this.gameService.findAllGames();
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  completeGame(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.gameService.completeGame(id, userId);
  }
}