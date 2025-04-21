import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJobAddIsSharable1702758945676 implements MigrationInterface {
    name = 'UpdateJobAddIsSharable1702758945676';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` ADD \`isSharable\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`isSharable\``);
    }
}
