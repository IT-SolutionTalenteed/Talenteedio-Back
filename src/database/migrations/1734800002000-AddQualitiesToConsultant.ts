import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQualitiesToConsultant1734800002000 implements MigrationInterface {
    name = 'AddQualitiesToConsultant1734800002000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`consultant\` 
            ADD COLUMN \`qualities\` json NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`consultant\` 
            DROP COLUMN \`qualities\`
        `);
    }
}