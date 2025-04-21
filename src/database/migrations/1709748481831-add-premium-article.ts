import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPremiumArticle1709748481831 implements MigrationInterface {
    name = 'AddPremiumArticle1709748481831';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`publicContent\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`isPremium\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`isPremium\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`publicContent\``);
    }
}
