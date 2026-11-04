import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, BadRequestException } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, Length, MinLength, Matches } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[A-Za-z0-9_.-]+$/, { message: 'Username may only contain letters, numbers, _ . -' })
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':",./<>?\\|`~])/, {
    message: 'Password must contain uppercase, lowercase, a number, and a special character',
  })
  password: string;
}

class LoginDto {
  @IsString()
  @Length(1, 255)
  identifier: string;

  @IsString()
  @MinLength(1)
  password: string;
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 5 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    const username = body.username?.trim() || undefined;
    const email = body.email?.trim().toLowerCase() || undefined;
    if (!username && !email) {
      throw new BadRequestException('Provide an email or a username');
    }
    return this.authService.register(username, email, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.identifier, body.password);
  }
}
