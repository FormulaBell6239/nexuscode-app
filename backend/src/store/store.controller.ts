import { Controller, Get, Post, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // Public — guests can view catalog; logged-in users see their credits + owned state
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getCatalog(@Req() req: Request) {
    const userId: number | null = (req as any).user?.sub ?? null;
    return this.storeService.getCatalog(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('buy/:itemId')
  purchase(@Req() req: Request, @Param('itemId', ParseIntPipe) itemId: number) {
    const userId = (req as any).user.sub;
    return this.storeService.purchase(userId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owned')
  getOwned(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.storeService.getOwnedItems(userId);
  }
}
