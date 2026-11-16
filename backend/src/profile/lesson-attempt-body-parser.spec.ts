import express, { NextFunction, Request, Response } from 'express';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { json } from 'express';
import { lessonAttemptJsonParser, requireLessonAttemptJson } from './lesson-attempt-body-parser';

describe('lesson attempt body parser HTTP behavior', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    const app = express();
    // Mirrors main.ts: the AI parser is route-scoped and precedes the lesson parser.
    app.use('/api/ai', json({ limit: '30mb' }));
    app.use('/api/profile/lesson-attempts', requireLessonAttemptJson, lessonAttemptJsonParser());
    app.use(json());
    app.use(express.urlencoded({ extended: true }));
    app.post('/api/profile/lesson-attempts', (req: Request, res: Response) => res.json({ body: req.body }));
    app.post('/api/ai/test', (req: Request, res: Response) => res.json({ body: req.body }));
    app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(error.status ?? 500).json({ statusCode: error.status ?? 500 });
    });

    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it('accepts JSON with a charset and parses it before the general parser', async () => {
    const response = await post('/api/profile/lesson-attempts', '{"lessonKey":"html-headings"}', 'application/json; charset=utf-8');
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ body: { lessonKey: 'html-headings' } });
  });

  it('returns 413 for JSON above 80 KB before the general 100 KB parser', async () => {
    const body = JSON.stringify({ code: 'x'.repeat(90 * 1024) });
    const response = await post('/api/profile/lesson-attempts', body, 'application/json');
    expect(response.status).toBe(413);
  });

  it.each(['text/plain', 'application/x-www-form-urlencoded'])('rejects unsupported content type %s with 415', async (contentType) => {
    const response = await post('/api/profile/lesson-attempts', 'lessonKey=html-headings', contentType);
    expect(response.status).toBe(415);
    expect(JSON.parse(response.body).code).toBe('UNSUPPORTED_LESSON_ATTEMPT_CONTENT_TYPE');
  });

  it('rejects a missing content type with 415', async () => {
    const response = await post('/api/profile/lesson-attempts', '{"lessonKey":"html-headings"}');
    expect(response.status).toBe(415);
  });

  it('keeps the 30 MB AI parser scoped to AI routes', async () => {
    const body = JSON.stringify({ payload: 'x'.repeat(90 * 1024) });
    const response = await post('/api/ai/test', body, 'application/json');
    expect(response.status).toBe(200);
  });

  function post(path: string, body: string, contentType?: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string | number> = { 'content-length': Buffer.byteLength(body) };
      if (contentType) headers['content-type'] = contentType;
      const request = require('http').request({ hostname: '127.0.0.1', port, path, method: 'POST', headers }, (response: any) => {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => { responseBody += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body: responseBody }));
      });
      request.on('error', reject);
      request.end(body);
    });
  }
});
