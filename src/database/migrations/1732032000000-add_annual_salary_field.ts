import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnnualSalaryField1732032000000 implements MigrationInterface {
    name = 'AddAnnualSalaryField1732032000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add annualSalary field to talent table
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`annualSalary\` decimal(10,2) NULL`);

        // Add annualSalary field to freelance table
        await queryRunner.query(`ALTER TABLE \`freelance\` ADD \`annualSalary\` decimal(10,2) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove annualSalary field from freelance table
        await queryRunner.query(`ALTER TABLE \`freelance\` DROP COLUMN \`annualSalary\``);

        // Remove annualSalary field from talent table
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`annualSalary\``);
    }
}
