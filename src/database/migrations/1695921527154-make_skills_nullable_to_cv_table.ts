import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeSkillsNullableToCvTable1695921527154 implements MigrationInterface {
    name = 'MakeSkillsNullableToCvTable1695921527154';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`skills\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`skills\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`skills\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`skills\` json NOT NULL`);
    }
}
