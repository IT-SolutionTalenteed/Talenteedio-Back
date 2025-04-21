import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeStatusDefaultForTalent1694629776387 implements MigrationInterface {
    name = 'ChangeStatusDefaultForTalent1694629776387';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'in_review'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` CHANGE \`status\` \`status\` enum CHARACTER SET "utf8mb4" COLLATE "utf8mb4_general_ci" ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT ''public''`);
    }
}
