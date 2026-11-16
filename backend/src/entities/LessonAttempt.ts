import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Source definition only. This entity is intentionally not registered in AppModule. */
@Entity({ name: 'lesson_attempt' })
@Index('IDX_lesson_attempt_pending_expiry', ['status', 'expiresAt'])
export class LessonAttempt {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 200 })
  lessonKey: string;

  @Column({ type: 'varchar', length: 12 })
  status: 'pending' | 'succeeded' | 'failed';

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceHash: string | null;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, unknown> | null;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
