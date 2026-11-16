import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLessonAttempts1794268800000 implements MigrationInterface {
  name = 'CreateLessonAttempts1794268800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const duplicateProgressRows = await queryRunner.query(
      `SELECT "userId" FROM "user_progress" GROUP BY "userId" HAVING COUNT(*) > 1 LIMIT 1`,
    );
    if (duplicateProgressRows.length > 0) {
      throw new Error('Cannot add user_progress userId uniqueness: duplicate rows require reviewed reconciliation first.');
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_progress_userId" ON "user_progress" ("userId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson_attempt" (
        "id" uuid NOT NULL,
        "userId" integer NOT NULL,
        "lessonKey" character varying(200) NOT NULL,
        "status" character varying(12) NOT NULL DEFAULT 'pending',
        "sourceHash" character varying(64),
        "result" jsonb,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "submittedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lesson_attempt" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_lesson_attempt_status" CHECK ("status" IN ('pending', 'succeeded', 'failed')),
        CONSTRAINT "FK_lesson_attempt_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_attempt_pending_expiry" ON "lesson_attempt" ("status", "expiresAt")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // After activation this drops submitted attempt receipts, including their idempotency
    // hashes and reward audit results. Prefer a forward repair once attempts exist.
    await queryRunner.query(`DROP INDEX "IDX_lesson_attempt_pending_expiry"`);
    await queryRunner.query(`DROP TABLE "lesson_attempt"`);
    await queryRunner.query(`DROP INDEX "UQ_user_progress_userId"`);
  }
}
