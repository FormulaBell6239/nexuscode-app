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

  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userAchievements: UserAchievement[];
}
