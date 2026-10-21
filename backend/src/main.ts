import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

function isPositiveInteger(raw: string | undefined): boolean {
  if (!raw) return false;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0;
}

function isValidHttpUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPlaceholder(raw: string | undefined): boolean {
  if (!raw) return true;
  return /(change_me|replace_me|example|your_|placeholder)/i.test(raw);
}

function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const errors: string[] = [];
  const required = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'FRONTEND_URL'];

  for (const key of required) {
    const value = process.env[key];
    if (!value || !value.trim()) {
      errors.push(`Missing required env var: ${key}`);
      continue;
    }
    if (isPlaceholder(value)) {
      errors.push(`Env var ${key} still uses a placeholder value`);
    }
  }

  if (!isPositiveInteger(process.env.DB_PORT)) {
    errors.push('DB_PORT must be a positive integer');
  }

  if (process.env.PORT && !isPositiveInteger(process.env.PORT)) {
    errors.push('PORT must be a positive integer when provided');
  }

  if (!isValidHttpUrl(process.env.FRONTEND_URL)) {
    errors.push('FRONTEND_URL must be a valid http/https URL');
  }

  const jwtSecret = process.env.JWT_SECRET ?? '';
  if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production');
  }

  if (errors.length > 0) {
    throw new Error(`FATAL: invalid production environment configuration:\n- ${errors.join('\n- ')}`);
  }
}

async function bootstrap() {
  validateProductionEnv();
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Reject requests with unknown fields; validate all incoming DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Strict localhost origin check — matches only http://localhost or http://localhost:<port>
  // Prevents bypass via http://localhost.evil.com (startsWith was vulnerable to this)
  const LOCALHOST_ORIGIN = /^http:\/\/localhost(:\d+)?$/;
  // Allow LAN IPs (192.168.x.x / 10.x.x.x) for mobile dev access on the same network
  const LAN_ORIGIN = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || LOCALHOST_ORIGIN.test(origin) || LAN_ORIGIN.test(origin) || origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT ?? '3001', 10);

  await app.listen(port);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`NexusCode backend running on http://localhost:${port}`);
  }
}
bootstrap();