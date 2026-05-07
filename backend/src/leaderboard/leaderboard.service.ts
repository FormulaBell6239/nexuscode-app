import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from '../entities/UserProgress';
import { User } from '../entities/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getLeaderboard(limit = 10) {
    const entries = await this.progressRepo.find({
      order: { xp: 'DESC' },
      take: limit,
      relations: ['user'],
    });

    return entries.map((entry, i) => ({
      rank: i + 1,
      username: entry.user?.username ?? 'Unknown',
      avatar: entry.user?.avatar ?? '👾',
      xp: entry.xp,
      level: entry.level,
      streak: entry.streak,
    }));
  }
}
