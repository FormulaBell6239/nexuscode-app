import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Genre = 'quiz' | 'debug' | 'speed' | 'logic' | 'build' | 'collab';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @Column({ nullable: true })
  href: string;

  @Column({ type: 'varchar', length: 10 })
  difficulty: Difficulty;

  @Column({ type: 'varchar', length: 20 })
  genre: Genre;

  @Column({ default: false })
  locked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
