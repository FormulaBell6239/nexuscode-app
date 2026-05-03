import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProgress } from '../entities/UserProgress';

export interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  avatar?: string;
  callingCard?: string;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const progress = await this.progressRepo.findOne({ where: { userId } });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      callingCard: user.callingCard,
      xp: progress?.xp ?? 0,
      level: progress?.level ?? 1,
      streak: progress?.streak ?? 0,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.callingCard !== undefined) user.callingCard = dto.callingCard;

    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      username: saved.username,
      displayName: saved.displayName,
      bio: saved.bio,
      avatar: saved.avatar,
      callingCard: saved.callingCard,
    };
  }
}
