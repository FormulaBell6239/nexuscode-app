import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793833986530 implements MigrationInterface {
    name = 'InitialSchema1793833986530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying, "password" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "displayName" character varying, "bio" text, "avatar" character varying DEFAULT '👾', "callingCard" character varying DEFAULT 'indigo', "plan" character varying NOT NULL DEFAULT 'free', "theme" character varying NOT NULL DEFAULT 'default', "role" character varying NOT NULL DEFAULT 'user', "communityBannedUntil" TIMESTAMP, "stripeCustomerId" character varying, "stripeSubscriptionId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "icon" character varying NOT NULL, "href" character varying, "difficulty" character varying(10) NOT NULL, "genre" character varying(20) NOT NULL, "locked" boolean NOT NULL DEFAULT false, "slug" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_achievement" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "achievementId" integer NOT NULL, "progress" integer NOT NULL DEFAULT '0', "earned" boolean NOT NULL DEFAULT false, "earnedAt" TIMESTAMP, CONSTRAINT "PK_99df4f0afe2d706c05004854aa5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "achievement" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "icon" character varying NOT NULL, "type" character varying, "requiredCount" integer NOT NULL DEFAULT '1', "creditReward" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_e3c415098b42f5a834e0752394c" UNIQUE ("name"), CONSTRAINT "PK_441339f40e8ce717525a381671e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_progress" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "xp" integer NOT NULL DEFAULT '0', "level" integer NOT NULL DEFAULT '1', "streak" integer NOT NULL DEFAULT '0', "longestStreak" integer NOT NULL DEFAULT '0', "lastActiveDate" TIMESTAMP, "energy" integer NOT NULL DEFAULT '10', "maxEnergy" integer NOT NULL DEFAULT '10', "energyLastRegen" TIMESTAMP, "overclockActiveUntil" TIMESTAMP, "credits" integer NOT NULL DEFAULT '0', "hearts" integer NOT NULL DEFAULT '10', "heartsLastRefilled" character varying, "completedLessons" text NOT NULL DEFAULT '[]', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7b5eb2436efb0051fdf05cbe839" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "store_item" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "icon" character varying NOT NULL, "category" character varying NOT NULL, "creditCost" integer NOT NULL, "gameSlug" character varying, "cosmeticType" character varying, "applyValue" character varying, "oneTimePurchase" boolean NOT NULL DEFAULT true, "available" boolean NOT NULL DEFAULT true, "milestoneOnly" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d8d520cf8af78e9dd5bc47943c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_purchase" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "itemId" integer NOT NULL, "isPrize" boolean NOT NULL DEFAULT false, "purchasedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_85d76883b43ad04f7ae5d96d242" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "community_post" ("id" SERIAL NOT NULL, "authorId" integer NOT NULL, "type" character varying(20) NOT NULL, "title" character varying(140) NOT NULL, "body" text NOT NULL, "tags" text array NOT NULL DEFAULT ARRAY[]::text[], "projectUrl" character varying(300), "votes" integer NOT NULL DEFAULT '0', "replyCount" integer NOT NULL DEFAULT '0', "acceptedReplyId" integer, "status" character varying(10) NOT NULL DEFAULT 'visible', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7b57231e04516d8689309424058" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0705caf2b948a760c1d24f934d" ON "community_post" ("authorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf8630483db1202c987512c62e" ON "community_post" ("status", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "community_reply" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "authorId" integer NOT NULL, "parentId" integer, "body" text NOT NULL, "votes" integer NOT NULL DEFAULT '0', "isAccepted" boolean NOT NULL DEFAULT false, "status" character varying(10) NOT NULL DEFAULT 'visible', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dce60957247fdf1e2363c99075b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_70f19ffcdd44019f18f8cc51ab" ON "community_reply" ("postId") `);
        await queryRunner.query(`CREATE TABLE "community_vote" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "targetType" character varying(10) NOT NULL, "targetId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f986c5885a814d0370129ddd92e" UNIQUE ("userId", "targetType", "targetId"), CONSTRAINT "PK_c69b65121db59dd678e63ee18b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "community_report" ("id" SERIAL NOT NULL, "reporterId" integer NOT NULL, "targetType" character varying(10) NOT NULL, "targetId" integer NOT NULL, "reason" character varying(20) NOT NULL, "details" character varying(500), "status" character varying(12) NOT NULL DEFAULT 'open', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_702290ba7a3e95352b0de8070fb" UNIQUE ("reporterId", "targetType", "targetId"), CONSTRAINT "PK_227c22518d7e4f80beb1328055f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "community_notification" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "type" character varying(12) NOT NULL, "actorId" integer NOT NULL, "postId" integer NOT NULL, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eb9676d363ce5e2bd79949bb2e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6143f4a77222a27c32dc1c30c6" ON "community_notification" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_achievement" ADD CONSTRAINT "FK_2a418515c335cab7c5ba70c28b3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_achievement" ADD CONSTRAINT "FK_843ecd1965f1aac694875674a18" FOREIGN KEY ("achievementId") REFERENCES "achievement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_progress" ADD CONSTRAINT "FK_b5d0e1b57bc6c761fb49e79bf89" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_purchase" ADD CONSTRAINT "FK_55db75fa077cfd00986f1785a42" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_purchase" ADD CONSTRAINT "FK_6345cb3555bd2201d9a4b9745f1" FOREIGN KEY ("itemId") REFERENCES "store_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_post" ADD CONSTRAINT "FK_0705caf2b948a760c1d24f934de" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_reply" ADD CONSTRAINT "FK_70f19ffcdd44019f18f8cc51ab7" FOREIGN KEY ("postId") REFERENCES "community_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_reply" ADD CONSTRAINT "FK_0852f44ef8eee46cfa57a694046" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "community_reply" DROP CONSTRAINT "FK_0852f44ef8eee46cfa57a694046"`);
        await queryRunner.query(`ALTER TABLE "community_reply" DROP CONSTRAINT "FK_70f19ffcdd44019f18f8cc51ab7"`);
        await queryRunner.query(`ALTER TABLE "community_post" DROP CONSTRAINT "FK_0705caf2b948a760c1d24f934de"`);
        await queryRunner.query(`ALTER TABLE "user_purchase" DROP CONSTRAINT "FK_6345cb3555bd2201d9a4b9745f1"`);
        await queryRunner.query(`ALTER TABLE "user_purchase" DROP CONSTRAINT "FK_55db75fa077cfd00986f1785a42"`);
        await queryRunner.query(`ALTER TABLE "user_progress" DROP CONSTRAINT "FK_b5d0e1b57bc6c761fb49e79bf89"`);
        await queryRunner.query(`ALTER TABLE "user_achievement" DROP CONSTRAINT "FK_843ecd1965f1aac694875674a18"`);
        await queryRunner.query(`ALTER TABLE "user_achievement" DROP CONSTRAINT "FK_2a418515c335cab7c5ba70c28b3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6143f4a77222a27c32dc1c30c6"`);
        await queryRunner.query(`DROP TABLE "community_notification"`);
        await queryRunner.query(`DROP TABLE "community_report"`);
        await queryRunner.query(`DROP TABLE "community_vote"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_70f19ffcdd44019f18f8cc51ab"`);
        await queryRunner.query(`DROP TABLE "community_reply"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf8630483db1202c987512c62e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0705caf2b948a760c1d24f934d"`);
        await queryRunner.query(`DROP TABLE "community_post"`);
        await queryRunner.query(`DROP TABLE "user_purchase"`);
        await queryRunner.query(`DROP TABLE "store_item"`);
        await queryRunner.query(`DROP TABLE "user_progress"`);
        await queryRunner.query(`DROP TABLE "achievement"`);
        await queryRunner.query(`DROP TABLE "user_achievement"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
