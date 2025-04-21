import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDidYouKnowToSettingTable1696432480520 implements MigrationInterface {
    name = 'AddDidYouKnowToSettingTable1696432480520';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`didYouKnow\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`didYouKnow\``);
    }
}
