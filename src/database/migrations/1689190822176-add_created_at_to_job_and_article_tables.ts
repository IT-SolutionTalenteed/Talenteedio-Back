import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtToJobAndArticleTables1689190822176 implements MigrationInterface {
    name = 'AddCreatedAtToJobAndArticleTables1689190822176';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`createdAt\``);
    }
}
