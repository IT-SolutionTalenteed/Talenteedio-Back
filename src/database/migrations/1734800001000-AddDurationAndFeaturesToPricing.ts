import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDurationAndFeaturesToPricing1734800001000 implements MigrationInterface {
    name = 'AddDurationAndFeaturesToPricing1734800001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`pricing\` 
            ADD COLUMN \`duration\` varchar(255) NULL,
            ADD COLUMN \`features\` json NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`pricing\` 
            DROP COLUMN \`duration\`,
            DROP COLUMN \`features\`
        `);
    }
}