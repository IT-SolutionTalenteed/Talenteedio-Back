import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaDescriptionToArticleAndJob1694608043539 implements MigrationInterface {
    name = 'AddMetaDescriptionToArticleAndJob1694608043539';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`metaDescription\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD \`metaDescription\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`metaDescription\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`metaDescription\``);
    }
}
