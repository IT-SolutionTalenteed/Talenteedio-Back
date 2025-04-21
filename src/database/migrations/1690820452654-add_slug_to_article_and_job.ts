import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugToArticleAndJob1690820452654 implements MigrationInterface {
    name = 'AddSlugToArticleAndJob1690820452654';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`slug\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD \`slug\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`slug\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`slug\``);
    }
}
