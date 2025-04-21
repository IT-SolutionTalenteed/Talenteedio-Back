import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobAddUpdatedAt1706187615836 implements MigrationInterface {
    name = 'JobAddUpdatedAt1706187615836';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`UPDATE \`job\` SET \`updatedAt\` = \`createdAt\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`updatedAt\``);
    }
}
