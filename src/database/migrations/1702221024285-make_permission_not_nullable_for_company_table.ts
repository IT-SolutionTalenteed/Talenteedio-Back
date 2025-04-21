import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePermissionNotNullableForCompanyTable1702221024285 implements MigrationInterface {
    name = 'MakePermissionNotNullableForCompanyTable1702221024285';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`permissionId\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`permissionId\` varchar(36) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`permissionId\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`permissionId\` varchar(36) NULL`);
    }
}
