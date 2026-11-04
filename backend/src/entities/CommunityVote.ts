import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type TargetType = 'post' | 'reply';

@Entity()
@Unique(['userId', 'targetType', 'targetId'])
export class CommunityVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 10 })
  targetType: TargetType;

  @Column()
  targetId: number;

  @CreateDateColumn()
  createdAt: Date;
}
