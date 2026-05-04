import { Controller, Get, Post, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('store')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  getCatalog(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.storeService.getCatalog(userId);
  }

  @Post('buy/:itemId')
  purchase(@Req() req: Request, @Param('itemId', ParseIntPipe) itemId: number) {
    const userId = (req as any).user.sub;
    return this.storeService.purchase(userId, itemId);
  }

  @Get('owned')
  getOwned(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.storeService.getOwnedItems(userId);
  }
}
