import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserAchievement } from './UserAchievement';

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @Column({ nullable: true })
  type: string;

  @Column({ default: 1 })
  requiredCount: number;

  // One-time credit bonus awarded when this achievement is first earned
  @Column({ default: 0 })
  creditReward: number;

  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userAchievements: UserAchievement[];
}
