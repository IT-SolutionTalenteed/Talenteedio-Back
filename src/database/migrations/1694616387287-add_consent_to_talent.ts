import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConsentToTalent1694616387287 implements MigrationInterface {
    name = 'AddConsentToTalent1694616387287';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`consentId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD CONSTRAINT \`FK_7b98e7dea2221917ba6d901abaa\` FOREIGN KEY (\`consentId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` DROP FOREIGN KEY \`FK_7b98e7dea2221917ba6d901abaa\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`consentId\``);
    }
}
