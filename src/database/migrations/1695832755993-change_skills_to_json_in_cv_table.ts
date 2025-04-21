import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeSkillsToJsonInCvTable1695832755993 implements MigrationInterface {
    name = 'ChangeSkillsToJsonInCvTable1695832755993';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`skills\` json NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`skills\``);
    }
}
