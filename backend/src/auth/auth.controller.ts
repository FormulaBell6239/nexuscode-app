import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsString()
  @Length(3, 30)
  username: string;

  @IsEmail()
  email: string;

  @MinLength(8)
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
    return this.authService.register(body.username, body.email, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.identifier, body.password);
  }
}
