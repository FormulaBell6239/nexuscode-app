import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Achievement } from './Achievement';

@Entity()
export class UserAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  @Column()
  achievementId: number;

  @Column({ default: 0 })
  progress: number;

  @Column({ default: false })
  earned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  earnedAt: Date | null;
}
