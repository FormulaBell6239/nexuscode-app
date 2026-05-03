import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { ProfileService, UpdateProfileDto } from './profile.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

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
}
