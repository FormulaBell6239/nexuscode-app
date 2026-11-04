import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeedback1793834472714 implements MigrationInterface {
    name = 'AddFeedback1793834472714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "userId" integer, "category" character varying(12) NOT NULL, "message" character varying(2000) NOT NULL, "page" character varying(300), "userAgent" character varying(300), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "community_post" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "community_post" ALTER COLUMN "tags" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`DROP TABLE "feedback"`);
    }

}
