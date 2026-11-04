import { HttpException } from '@nestjs/common';
import { AiController } from './ai.controller';

describe('AiController daily cap', () => {
  const service = { chat: jest.fn().mockResolvedValue({ reply: 'hi' }) } as any;
  const ctrl = new AiController(service);
  const req = (sub: number, plan = 'free') => ({ user: { sub, plan } } as any);

  it('allows requests under the limit', async () => {
    await expect(ctrl.chat(req(1), {} as any)).resolves.toEqual({ reply: 'hi' });
  });

  it('blocks a free user after 50 messages with a 429', async () => {
    for (let i = 0; i < 50; i++) await ctrl.chat(req(2), {} as any);
    await ctrl.chat(req(2), {} as any).then(
      () => { throw new Error('expected 429'); },
      (e) => { expect(e).toBeInstanceOf(HttpException); expect(e.getStatus()).toBe(429); },
    );
  });

  it('does not affect other users', async () => {
    await expect(ctrl.chat(req(3), {} as any)).resolves.toBeDefined();
  });
});
