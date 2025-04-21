import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInReviewStatus1688105290392 implements MigrationInterface {
    name = 'AddInReviewStatus1688105290392';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE \`job_type\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE \`skill\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE \`location\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT ''public''`);
        await queryRunner.query(`ALTER TABLE \`location\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT ''public''`);
        await queryRunner.query(`ALTER TABLE \`skill\` CHANGE \`status\` \`status\` enum ('public', 'daft', 'blocked') NOT NULL DEFAULT ''public''`);
        await queryRunner.query(`ALTER TABLE \`job_type\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT ''public''`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT ''public''`);
    }
}
