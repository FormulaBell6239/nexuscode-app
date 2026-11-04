import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 12 })
  category: 'bug' | 'idea' | 'other';

  @Column({ type: 'varchar', length: 2000 })
  message: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  page: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
