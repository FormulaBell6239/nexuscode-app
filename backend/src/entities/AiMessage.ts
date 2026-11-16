import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AiConversation } from './AiConversation';

@Entity('ai_message')
@Index('IDX_ai_message_conversation_id', ['conversationId', 'id'])
export class AiMessage {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'uuid' }) conversationId: string;
  @ManyToOne(() => AiConversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: AiConversation;
  @Column({ length: 10 }) role: 'user' | 'assistant';
  @Column({ type: 'text' }) content: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
