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

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow any localhost origin in dev, or the configured FRONTEND_URL in prod
      if (!origin || origin.startsWith('http://localhost') || origin === process.env.FRONTEND_URL) {
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