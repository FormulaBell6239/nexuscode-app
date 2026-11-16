import { NotFoundException } from '@nestjs/common';
import { AiMemoryService, searchTerms } from './ai-memory.service';

jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
jest.mock('typeorm', () => ({ Repository: class Repository {}, DataSource: class DataSource {} }));
jest.mock('../entities/AiConversation', () => ({ AiConversation: class AiConversation {} }));
jest.mock('../entities/AiMessage', () => ({ AiMessage: class AiMessage {} }));
jest.mock('./ai.service', () => ({ AiService: class AiService {} }));

describe('AI conversation memory', () => {
  const conversations = { findOne: jest.fn(), delete: jest.fn() };
  const messages = { find: jest.fn() };
  const service = new AiMemoryService(conversations as never, messages as never, {} as never, {} as never);

  beforeEach(() => jest.clearAllMocks());

  it('scopes reads to the authenticated user and rejects another user’s chat', async () => {
    conversations.findOne.mockResolvedValue(null);
    await expect(service.get(42, 'conversation')).rejects.toBeInstanceOf(NotFoundException);
    expect(conversations.findOne).toHaveBeenCalledWith({ where: { id: 'conversation', userId: 42 } });
    expect(messages.find).not.toHaveBeenCalled();
  });

  it('scopes deletion to the authenticated user', async () => {
    conversations.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove(42, 'conversation')).rejects.toBeInstanceOf(NotFoundException);
    expect(conversations.delete).toHaveBeenCalledWith({ id: 'conversation', userId: 42 });
  });

  it('limits and sanitizes keyword search input', () => {
    expect(searchTerms("Help with NexusCode PostgreSQL error'); DROP TABLE users --")).toBe('nexuscode | postgresql | error | drop | table | users');
    expect(searchTerms('alpha bravo charlie delta echo foxtrot golf hotel india').split(' | ')).toHaveLength(8);
  });

  it('sends bounded recent history and relevant account-scoped memory', async () => {
    const recent = Array.from({ length: 10 }, (_, index) => ({
      id: 20 - index,
      role: index % 2 ? 'user' : 'assistant',
      content: 'x'.repeat(2000),
    }));
    conversations.findOne.mockResolvedValue({ id: 'conversation', userId: 42, title: 'Test', summary: 's'.repeat(3000) });
    messages.find.mockResolvedValue(recent);
    const manager = {
      insert: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const runner = {
      connect: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([{ locked: true }])
        .mockResolvedValueOnce([{ title: 'Old', summary: 'r'.repeat(1000) }])
        .mockResolvedValueOnce([{ title: 'Earlier', content: 'p'.repeat(1000) }])
        .mockResolvedValueOnce([]),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager,
    };
    const ai = { chat: jest.fn().mockResolvedValue({ reply: 'answer' }) };
    const memory = new AiMemoryService(conversations as never, messages as never, { createQueryRunner: () => runner } as never, ai as never);
    await expect(memory.chat(42, { conversationId: 'conversation', message: 'PostgreSQL database' })).resolves.toEqual({ reply: 'answer' });
    const [dto, , context] = ai.chat.mock.calls[0];
    expect(dto.history).toHaveLength(10);
    expect(dto.history.every((item: { content: string }) => item.content.length === 1200)).toBe(true);
    expect(context).toContain('s'.repeat(1800));
    expect(context).not.toContain('s'.repeat(1801));
    expect(context).toContain('r'.repeat(600));
    expect(context).not.toContain('r'.repeat(601));
    expect(context).toContain('p'.repeat(400));
    expect(context).not.toContain('p'.repeat(401));
    expect(runner.query.mock.calls[1][1][0]).toBe(42);
    expect(runner.query.mock.calls[2][1][0]).toBe(42);
    expect(runner.commitTransaction).toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });
});
