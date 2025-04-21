import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtToTables1690447871024 implements MigrationInterface {
    name = 'AddCreatedAtToTables1690447871024';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`role\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`admin\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`user_session\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`media\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`address\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`contact\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`job_type\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`skill\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`location\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`category\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`lm\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`testimonial\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`testimonial\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`lm\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`location\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`skill\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`job_type\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`contact\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`address\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`media\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`user_session\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`admin\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`role\` DROP COLUMN \`createdAt\``);
    }
}
