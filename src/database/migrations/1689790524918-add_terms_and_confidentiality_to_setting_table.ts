import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTermsAndConfidentialityToSettingTable1689790524918 implements MigrationInterface {
    name = 'AddTermsAndConfidentialityToSettingTable1689790524918';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`terms\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`confidentiality\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`confidentiality\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`terms\``);
    }
}
