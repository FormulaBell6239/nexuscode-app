
import { ConflictException, GoneException, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AddressInfo } from 'net';

jest.mock('./profile.service', () => ({
  ProfileService: class ProfileService {},
}));

jest.mock('../guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('ProfileController legacy XP endpoint', () => {
  it('returns 410 Gone and never calls the reward service', () => {
    const profileService = { addXp: jest.fn() } as any;
    const controller = new ProfileController(profileService);

    expect(() => controller.submitXp()).toThrow(GoneException);
    expect(profileService.addXp).not.toHaveBeenCalled();
  });

  it('maps a controller ConflictException to an actual HTTP 409 without a database', async () => {
    const service = {
      submitLessonAttempt: jest.fn().mockRejectedValue(
        new ConflictException({
          code: 'LESSON_ATTEMPT_SOURCE_CONFLICT',
        }),
      ),
    };

    class HttpTestModule {}

    Module({
      controllers: [ProfileController],
      providers: [
        { provide: ProfileService, useValue: service },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: () => true,
          },
        },
      ],
    })(HttpTestModule);

    const app = await NestFactory.create(HttpTestModule, {
      logger: ['error'],
    });

    // Supply an authenticated user for this isolated controller test.
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { sub: 7 };
      next();
    });

    await app.listen(0, '127.0.0.1');

    try {
      const address = app.getHttpServer().address() as AddressInfo;

      const result = await requestHttp(
        address.port,
        '/profile/lesson-attempts/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/submit',
        {
          code: 'same attempt, different source',
        },
      );

      expect(result.status).toBe(409);
      expect(JSON.parse(result.body).code).toBe(
        'LESSON_ATTEMPT_SOURCE_CONFLICT',
      );

      expect(service.submitLessonAttempt).toHaveBeenCalledWith(
        7,
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'same attempt, different source',
      );
    } finally {
      await app.close();
    }
  });
});

function requestHttp(
  port: number,
  path: string,
  body: Record<string, unknown>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);

    const client = require('http').request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        },
      },
      (response: any) => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          responseBody += chunk;
        });

        response.on('end', () => {
          resolve({
            status: response.statusCode,
            body: responseBody,
          });
        });
      },
    );

    client.on('error', reject);
    client.end(payload);
  });
}
