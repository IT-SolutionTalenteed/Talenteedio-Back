import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTalentExtendedFields1740500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Vérifier et ajouter les colonnes seulement si elles n'existent pas
        const table = await queryRunner.getTable('talent');
        
        if (table && !table.findColumnByName('currentSalary')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'currentSalary',
                type: 'varchar',
                length: '100',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('skillsText')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'skillsText',
                type: 'text',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('languages')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'languages',
                type: 'varchar',
                length: '255',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('educationText')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'educationText',
                type: 'text',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('desiredSector')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'desiredSector',
                type: 'varchar',
                length: '255',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('interests')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'interests',
                type: 'text',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('desiredPosition')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'desiredPosition',
                type: 'varchar',
                length: '255',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('desiredSalary')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'desiredSalary',
                type: 'varchar',
                length: '100',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('availability')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'availability',
                type: 'varchar',
                length: '255',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('country')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'country',
                type: 'varchar',
                length: '100',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('city')) {
            await queryRunner.addColumn('talent', new TableColumn({
                name: 'city',
                type: 'varchar',
                length: '100',
                isNullable: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('talent');
        
        if (table && table.findColumnByName('currentSalary')) {
            await queryRunner.dropColumn('talent', 'currentSalary');
        }
        if (table && table.findColumnByName('skillsText')) {
            await queryRunner.dropColumn('talent', 'skillsText');
        }
        if (table && table.findColumnByName('languages')) {
            await queryRunner.dropColumn('talent', 'languages');
        }
        if (table && table.findColumnByName('educationText')) {
            await queryRunner.dropColumn('talent', 'educationText');
        }
        if (table && table.findColumnByName('desiredSector')) {
            await queryRunner.dropColumn('talent', 'desiredSector');
        }
        if (table && table.findColumnByName('interests')) {
            await queryRunner.dropColumn('talent', 'interests');
        }
        if (table && table.findColumnByName('desiredPosition')) {
            await queryRunner.dropColumn('talent', 'desiredPosition');
        }
        if (table && table.findColumnByName('desiredSalary')) {
            await queryRunner.dropColumn('talent', 'desiredSalary');
        }
        if (table && table.findColumnByName('availability')) {
            await queryRunner.dropColumn('talent', 'availability');
        }
        if (table && table.findColumnByName('country')) {
            await queryRunner.dropColumn('talent', 'country');
        }
        if (table && table.findColumnByName('city')) {
            await queryRunner.dropColumn('talent', 'city');
        }
    }
}
