import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCompanyExtendedFields1740500000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('company');
        
        if (table && !table.findColumnByName('foundedDate')) {
            await queryRunner.addColumn('company', new TableColumn({
                name: 'foundedDate',
                type: 'date',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('employeeCount')) {
            await queryRunner.addColumn('company', new TableColumn({
                name: 'employeeCount',
                type: 'varchar',
                length: '50',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('profileSought')) {
            await queryRunner.addColumn('company', new TableColumn({
                name: 'profileSought',
                type: 'text',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('positionsToFill')) {
            await queryRunner.addColumn('company', new TableColumn({
                name: 'positionsToFill',
                type: 'varchar',
                length: '500',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('requiredSkills')) {
            await queryRunner.addColumn('company', new TableColumn({
                name: 'requiredSkills',
                type: 'varchar',
                length: '500',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('requiredExperience')) {
            await queryRunner.addColumn('company', new TableColumn({
                name: 'requiredExperience',
                type: 'varchar',
                length: '255',
                isNullable: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('company');
        
        if (table && table.findColumnByName('foundedDate')) {
            await queryRunner.dropColumn('company', 'foundedDate');
        }
        if (table && table.findColumnByName('employeeCount')) {
            await queryRunner.dropColumn('company', 'employeeCount');
        }
        if (table && table.findColumnByName('profileSought')) {
            await queryRunner.dropColumn('company', 'profileSought');
        }
        if (table && table.findColumnByName('positionsToFill')) {
            await queryRunner.dropColumn('company', 'positionsToFill');
        }
        if (table && table.findColumnByName('requiredSkills')) {
            await queryRunner.dropColumn('company', 'requiredSkills');
        }
        if (table && table.findColumnByName('requiredExperience')) {
            await queryRunner.dropColumn('company', 'requiredExperience');
        }
    }
}
