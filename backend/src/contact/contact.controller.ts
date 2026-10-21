import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}

@Controller('contact')
@UseGuards(ThrottlerGuard)
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  @Post()
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  submit(@Body() dto: ContactDto) {
    this.logger.log(`Contact form: ${dto.name} <${dto.email}> (${dto.message.length} chars)`);
    return { ok: true, message: "Thanks for reaching out — we'll get back to you soon!" };
  }
}
