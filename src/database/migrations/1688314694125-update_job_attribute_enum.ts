import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJobAttributeEnum1688314694125 implements MigrationInterface {
    name = 'UpdateJobAttributeEnum1688314694125';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` CHANGE \`gender\` \`gender\` enum ('male', 'female', 'other') NULL`);
        await queryRunner.query(`ALTER TABLE \`job\` CHANGE \`salaryType\` \`salaryType\` enum ('hourly', 'daily', 'weekly', 'monthly', 'yearly') NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` CHANGE \`salaryType\` \`salaryType\` enum ('hourly', 'daily', 'weekly', 'monthly', 'yearly') NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`job\` CHANGE \`gender\` \`gender\` enum ('male', 'female', 'other') NULL DEFAULT 'NULL'`);
    }
}
