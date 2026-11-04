import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserProgress } from '../entities/UserProgress';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    private readonly jwtService: JwtService,
  ) {}

  private async uniqueUsername(base: string): Promise<string> {
    const clean = base.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 24) || 'coder';
    let candidate = clean.length >= 3 ? clean : `${clean}user`;
    while (await this.userRepo.findOne({ where: { username: candidate } })) {
      candidate = `${clean}${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return candidate;
  }

  async register(username: string | undefined, email: string | undefined, password: string) {
    const conditions: { email?: string; username?: string }[] = [];
    if (email) conditions.push({ email });
    if (username) conditions.push({ username });
    const existing = await this.userRepo.findOne({ where: conditions });
    if (existing) {
      throw new ConflictException(
        username && email ? 'Username or email already in use'
          : username ? 'Username already in use' : 'Email already in use',
      );
    }

    // Email-only signups get a generated handle (shown on leaderboards); it can be changed later
    const finalUsername = username ?? (await this.uniqueUsername(email!.split('@')[0]));

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = this.userRepo.create({ username: finalUsername, email: email ?? null, password: hashed });
    const saved = await this.userRepo.save(user);

    // Create progress record with energy initialised
    const progress = this.progressRepo.create({
      userId: saved.id,
      energy: 5,
      maxEnergy: 10,
      energyLastRegen: new Date(),
    });
    await this.progressRepo.save(progress);

    return this.signToken(saved);
  }

  async login(identifier: string, password: string) {
    const user = await this.userRepo.findOne({
      where: [
        { email: identifier.trim() },
        { email: identifier.trim().toLowerCase() },
        { username: identifier.trim() },
      ],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user);
  }

  private signToken(user: User) {
    const payload = { sub: user.id, username: user.username, plan: user.plan ?? 'free' };
    return {
      token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, email: user.email, plan: user.plan ?? 'free' },
    };
  }
}
