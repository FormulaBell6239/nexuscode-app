import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
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
  const jwtSecret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!jwtSecret || jwtSecret === 'change_me_in_production')) {
    throw new Error('FATAL: JWT_SECRET must be set to a strong secret in production. Refusing to start.');
  }

  await app.listen(port);
  console.log(`NexusCode backend running on http://localhost:${port}`);
}
bootstrap();