import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CommunityPost, ContentStatus } from './CommunityPost';

@Entity()
export class CommunityReply {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CommunityPost, { nullable: false, onDelete: 'CASCADE' })
  post: CommunityPost;

  @Index()
  @Column()
  postId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  author: User;

  @Column()
  authorId: number;

  @Column({ type: 'int', nullable: true })
  parentId: number | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: 0 })
  votes: number;

  @Column({ default: false })
  isAccepted: boolean;

  @Column({ type: 'varchar', length: 10, default: 'visible' })
  status: ContentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
