import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
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
  await app.listen(port);
  console.log(`NexusCode backend running on http://localhost:${port}`);
}
bootstrap();