import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('ai_conversation')
@Index('IDX_ai_conversation_user_updated', ['userId', 'updatedAt'])
export class AiConversation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'integer' }) userId: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column({ length: 120, default: 'New conversation' }) title: string;
  @Column({ type: 'text', default: '' }) summary: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
