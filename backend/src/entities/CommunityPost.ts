import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export type PostType = 'question' | 'discussion' | 'project';
export type ContentStatus = 'visible' | 'hidden' | 'removed';

@Entity()
@Index(['status', 'createdAt'])
export class CommunityPost {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  author: User;

  @Index()
  @Column()
  authorId: number;

  @Column({ type: 'varchar', length: 20 })
  type: PostType;

  @Column({ type: 'varchar', length: 140 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  tags: string[];

  @Column({ type: 'varchar', length: 300, nullable: true })
  projectUrl: string | null;

  @Column({ default: 0 })
  votes: number;

  @Column({ default: 0 })
  replyCount: number;

  @Column({ type: 'int', nullable: true })
  acceptedReplyId: number | null;

  @Column({ type: 'varchar', length: 10, default: 'visible' })
  status: ContentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
