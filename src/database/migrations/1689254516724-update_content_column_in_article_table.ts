import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContentColumnInArticleTable1689254516724 implements MigrationInterface {
    name = 'UpdateContentColumnInArticleTable1689254516724';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`content\``);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`content\` text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`content\``);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`content\` varchar(255) NOT NULL`);
    }
}
