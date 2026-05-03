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

  async register(username: string, email: string, password: string) {
    const existing = await this.userRepo.findOne({
      where: [{ email }, { username }],
    });
    if (existing) {
      throw new ConflictException('Username or email already in use');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = this.userRepo.create({ username, email, password: hashed });
    const saved = await this.userRepo.save(user);

    // Create empty progress record for new user
    const progress = this.progressRepo.create({ userId: saved.id });
    await this.progressRepo.save(progress);

    return this.signToken(saved);
  }

  async login(identifier: string, password: string) {
    const user = await this.userRepo.findOne({
      where: [{ email: identifier }, { username: identifier }],
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
    const payload = { sub: user.id, username: user.username };
    return {
      token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, email: user.email },
    };
  }
}
