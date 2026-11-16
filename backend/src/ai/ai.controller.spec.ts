import { HttpException } from '@nestjs/common';
import { EventEmitter } from 'events';
import { AiController } from './ai.controller';

jest.mock('./ai-memory.service', () => ({ AiMemoryService: class AiMemoryService {} }));

describe('AiController daily cap', () => {
  const service = { chat: jest.fn().mockResolvedValue({ reply: 'hi' }) } as any;
  const ctrl = new AiController(service, {} as any);
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

  it('aborts the AI request when the client disconnects', async () => {
    const response = Object.assign(new EventEmitter(), { writableEnded: false });
    let resolveChat!: (value: { reply: string }) => void;
    service.chat.mockImplementationOnce(() => new Promise((resolve) => { resolveChat = resolve; }));
    const pending = ctrl.chat({ ...req(4), res: response }, {} as any);
    const signal = service.chat.mock.calls[service.chat.mock.calls.length - 1][1] as AbortSignal;
    expect(signal.aborted).toBe(false);
    response.emit('close');
    expect(signal.aborted).toBe(true);
    resolveChat({ reply: 'hi' });
    await pending;
    expect(response.listenerCount('close')).toBe(0);
  });

  it('does not abort after a completed response', async () => {
    const response = Object.assign(new EventEmitter(), { writableEnded: true });
    let resolveChat!: (value: { reply: string }) => void;
    service.chat.mockImplementationOnce(() => new Promise((resolve) => { resolveChat = resolve; }));
    const pending = ctrl.chat({ ...req(5), res: response }, {} as any);
    const signal = service.chat.mock.calls[service.chat.mock.calls.length - 1][1] as AbortSignal;
    response.emit('close');
    expect(signal.aborted).toBe(false);
    resolveChat({ reply: 'hi' });
    await pending;
    expect(response.listenerCount('close')).toBe(0);
  });
});
