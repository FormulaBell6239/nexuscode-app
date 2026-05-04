import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  streak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveDate: Date | null;

  // Energy system
  @Column({ default: 5 })
  energy: number;

  @Column({ default: 5 })
  maxEnergy: number;

  @Column({ type: 'timestamp', nullable: true })
  energyLastRegen: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  overclockActiveUntil: Date | null;

  // Credits (unlocks games)
  @Column({ default: 0 })
  credits: number;

  // Completed lessons (JSON array of lesson keys)
  @Column({ type: 'text', default: '[]' })
  completedLessons: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
