import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHomeTextContentToSettingTable1697480362721 implements MigrationInterface {
    name = 'AddHomeTextContentToSettingTable1697480362721';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`gateway\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`voice\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`initiative\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`initiative\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`voice\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`gateway\``);
    }
}
