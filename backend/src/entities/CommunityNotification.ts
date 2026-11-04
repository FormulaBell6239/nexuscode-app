import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationType = 'reply' | 'accepted';

@Entity()
export class CommunityNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 12 })
  type: NotificationType;

  @Column()
  actorId: number;

  @Column()
  postId: number;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
