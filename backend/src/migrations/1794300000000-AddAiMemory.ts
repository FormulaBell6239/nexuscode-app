import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiMemory1794300000000 implements MigrationInterface {
  name = 'AddAiMemory1794300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "ai_conversation" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" integer NOT NULL, "title" character varying(120) NOT NULL DEFAULT 'New conversation', "summary" text NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ai_conversation" PRIMARY KEY ("id"), CONSTRAINT "FK_ai_conversation_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_conversation_user_updated" ON "ai_conversation" ("userId", "updatedAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_conversation_search" ON "ai_conversation" USING GIN (to_tsvector('english', "title" || ' ' || "summary"))`);
    await queryRunner.query(`CREATE TABLE "ai_message" ("id" SERIAL NOT NULL, "conversationId" uuid NOT NULL, "role" character varying(10) NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ai_message" PRIMARY KEY ("id"), CONSTRAINT "FK_ai_message_conversation" FOREIGN KEY ("conversationId") REFERENCES "ai_conversation"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_message_conversation_id" ON "ai_message" ("conversationId", "id")`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_message_search" ON "ai_message" USING GIN (to_tsvector('english', "content"))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_message"`);
    await queryRunner.query(`DROP TABLE "ai_conversation"`);
  }
}
