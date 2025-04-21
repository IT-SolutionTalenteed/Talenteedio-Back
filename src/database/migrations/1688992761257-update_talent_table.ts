import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTalentTable1688992761257 implements MigrationInterface {
    name = 'UpdateTalentTable1688992761257';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`title\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`gender\` enum ('male', 'female', 'other') NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`experience\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`educationLevel\` enum ('certificate', 'diploma', 'associate', 'bachelor', 'master', 'professional') NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`contactId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD UNIQUE INDEX \`IDX_9fe5ee4ef721064c38ef950620\` (\`contactId\`)`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD CONSTRAINT \`FK_9fe5ee4ef721064c38ef9506201\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` DROP FOREIGN KEY \`FK_9fe5ee4ef721064c38ef9506201\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP INDEX \`IDX_9fe5ee4ef721064c38ef950620\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`contactId\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`educationLevel\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`experience\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`gender\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`title\``);
    }
}
