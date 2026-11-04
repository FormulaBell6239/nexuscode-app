import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TargetType } from './CommunityVote';

@Entity()
@Unique(['reporterId', 'targetType', 'targetId'])
export class CommunityReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reporterId: number;

  @Column({ type: 'varchar', length: 10 })
  targetType: TargetType;

  @Column()
  targetId: number;

  @Column({ type: 'varchar', length: 20 })
  reason: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  details: string | null;

  @Column({ type: 'varchar', length: 12, default: 'open' })
  status: 'open' | 'actioned' | 'dismissed';

  @CreateDateColumn()
  createdAt: Date;
}
