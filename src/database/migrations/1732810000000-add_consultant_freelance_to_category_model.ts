import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConsultantFreelanceToCategoryModel1732810000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`category\` 
            MODIFY COLUMN \`model\` enum('Company', 'Referral', 'Job', 'Talent', 'Freelance', 'Consultant', 'Job_Talent', 'Article', 'Event') NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`category\` 
            MODIFY COLUMN \`model\` enum('Company', 'Referral', 'Job', 'Talent', 'Job_Talent', 'Article', 'Event') NOT NULL
        `);
    }
}
