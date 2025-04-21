import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateArticleStatus1688028733175 implements MigrationInterface {
    name = 'UpdateArticleStatus1688028733175';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`status\` \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT 'public'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`status\` \`status\` enum ('STATUS_1', 'STATUS_2', 'STATUS_3') NOT NULL DEFAULT ''STATUS_1''`);
    }
}
