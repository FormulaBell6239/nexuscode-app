import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AiConversation } from '../entities/AiConversation';
import { AiMessage } from '../entities/AiMessage';
import { AiService } from './ai.service';
import { ChatDto } from './chat.dto';

const RECENT_MESSAGES = 10;
const MESSAGE_CONTEXT_CHARS = 1200;
const SUMMARY_CHARS = 1800;
const RELATED_LIMIT = 3;

export function searchTerms(message: string): string {
  const stop = new Set(['about', 'after', 'again', 'could', 'their', 'there', 'these', 'this', 'what', 'where', 'which', 'would', 'please', 'using', 'how', 'with', 'that', 'have', 'from', 'help', 'your', 'code', 'project']);
  return [...new Set((message.toLowerCase().match(/[a-z][a-z0-9_]{3,30}/g) ?? []).filter(word => !stop.has(word)))].slice(0, 8).join(' | ');
}

@Injectable()
export class AiMemoryService {
  constructor(
    @InjectRepository(AiConversation) private readonly conversations: Repository<AiConversation>,
    @InjectRepository(AiMessage) private readonly messages: Repository<AiMessage>,
    private readonly dataSource: DataSource,
    private readonly ai: AiService,
  ) {}

  async list(userId: number) {
    return this.conversations.find({ where: { userId }, select: ['id', 'title', 'createdAt', 'updatedAt'], order: { updatedAt: 'DESC' }, take: 100 });
  }

  async create(userId: number) {
    return this.conversations.save(this.conversations.create({ userId }));
  }

  private async owned(userId: number, id: string) {
    const conversation = await this.conversations.findOne({ where: { id, userId } });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return conversation;
  }

  async get(userId: number, id: string) {
    const conversation = await this.owned(userId, id);
    const messages = await this.messages.find({ where: { conversationId: id }, order: { id: 'DESC' }, take: 200 });
    return { id: conversation.id, title: conversation.title, messages: messages.reverse() };
  }

  async remove(userId: number, id: string) {
    const result = await this.conversations.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Conversation not found.');
    return { deleted: true };
  }

  async chat(userId: number, dto: ChatDto, signal?: AbortSignal) {
    const id = dto.conversationId;
    if (!id) return this.ai.chat(dto, signal);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    let locked = false;
    try {
      const lock = await runner.query('SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked', [id]) as { locked: boolean }[];
      locked = lock[0].locked;
      if (!locked) throw new ConflictException('A response is already in progress for this conversation.');
      const conversation = await this.owned(userId, id);
      const recent = await this.messages.find({ where: { conversationId: id }, order: { id: 'DESC' }, take: RECENT_MESSAGES });
      const terms = searchTerms(dto.message);
      const related: { title: string; summary: string }[] = terms
        ? await runner.query(
          `SELECT "title", "summary" FROM "ai_conversation"
           WHERE "userId" = $1 AND "id" <> $2 AND "summary" <> ''
             AND to_tsvector('english', "title" || ' ' || "summary") @@ to_tsquery('english', $3)
           ORDER BY ts_rank(to_tsvector('english', "title" || ' ' || "summary"), to_tsquery('english', $3)) DESC, "updatedAt" DESC
           LIMIT $4`,
          [userId, id, terms, RELATED_LIMIT],
        ) : [];
      const olderMessages: { title: string; content: string }[] = terms
        ? await runner.query(
          `SELECT c."title", m."content" FROM "ai_message" m
           JOIN "ai_conversation" c ON c."id" = m."conversationId"
           WHERE c."userId" = $1 AND m."role" = 'user' AND NOT (m."id" = ANY($2::integer[]))
             AND to_tsvector('english', m."content") @@ to_tsquery('english', $3)
           ORDER BY ts_rank(to_tsvector('english', m."content"), to_tsquery('english', $3)) DESC, m."id" DESC
           LIMIT 3`,
          [userId, recent.map(item => item.id), terms],
        ) : [];
      const memory = [
        conversation.summary ? `Current conversation notes:\n${conversation.summary.slice(0, SUMMARY_CHARS)}` : '',
        ...related.map(item => `Related previous conversation (${item.title}):\n${item.summary.slice(0, 600)}`),
        ...olderMessages.map(item => `Relevant earlier user message (${item.title}):\n${item.content.slice(0, 400)}`),
      ].filter(Boolean).join('\n\n');
      const history = recent.reverse().map(item => ({ role: item.role, content: item.content.slice(0, MESSAGE_CONTEXT_CHARS) }));
      const result = await this.ai.chat({ ...dto, history }, signal, memory);
      if (signal?.aborted) throw new Error('AI request aborted.');
      await runner.startTransaction();
      try {
        await runner.manager.insert(AiMessage, [
          { conversationId: id, role: 'user', content: dto.message },
          { conversationId: id, role: 'assistant', content: result.reply },
        ]);
        const notes = await runner.manager.find(AiMessage, { where: { conversationId: id, role: 'user' }, order: { id: 'DESC' }, take: 12 });
        const first = await runner.manager.findOne(AiMessage, { where: { conversationId: id, role: 'user' }, order: { id: 'ASC' } });
        const excerpts = [first, ...notes.reverse()].filter((item): item is AiMessage => Boolean(item));
        const unique = [...new Map(excerpts.map(item => [item.id, item])).values()];
        const summary = unique.map(item => `- ${item.content.replace(/\s+/g, ' ').slice(0, 220)}`).join('\n').slice(0, SUMMARY_CHARS);
        await runner.manager.update(AiConversation, { id, userId }, {
          title: conversation.title === 'New conversation' ? dto.message.replace(/\s+/g, ' ').trim().slice(0, 120) || 'New conversation' : conversation.title,
          summary,
          updatedAt: new Date(),
        });
        await runner.commitTransaction();
      } catch (error) {
        await runner.rollbackTransaction();
        throw error;
      }
      return result;
    } finally {
      if (locked) await runner.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [id]);
      await runner.release();
    }
  }
}
