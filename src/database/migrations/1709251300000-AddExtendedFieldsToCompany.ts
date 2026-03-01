import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExtendedFieldsToCompany1709251300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Vérifier et ajouter les colonnes si elles n'existent pas
        const table = await queryRunner.getTable('company');
        
        if (table && !table.findColumnByName('slogan')) {
            await queryRunner.addColumn(
                'company',
                new TableColumn({
                    name: 'slogan',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                })
            );
        }

        if (table && !table.findColumnByName('about')) {
            await queryRunner.addColumn(
                'company',
                new TableColumn({
                    name: 'about',
                    type: 'text',
                    isNullable: true,
                })
            );
        }

        if (table && !table.findColumnByName('headquarters')) {
            await queryRunner.addColumn(
                'company',
                new TableColumn({
                    name: 'headquarters',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                })
            );
        }

        if (table && !table.findColumnByName('website')) {
            await queryRunner.addColumn(
                'company',
                new TableColumn({
                    name: 'website',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                })
            );
        }

        if (table && !table.findColumnByName('socialNetworks')) {
            await queryRunner.addColumn(
                'company',
                new TableColumn({
                    name: 'socialNetworks',
                    type: 'json',
                    isNullable: true,
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('company');
        
        if (table && table.findColumnByName('slogan')) {
            await queryRunner.dropColumn('company', 'slogan');
        }
        
        if (table && table.findColumnByName('about')) {
            await queryRunner.dropColumn('company', 'about');
        }
        
        if (table && table.findColumnByName('headquarters')) {
            await queryRunner.dropColumn('company', 'headquarters');
        }
        
        if (table && table.findColumnByName('website')) {
            await queryRunner.dropColumn('company', 'website');
        }
        
        if (table && table.findColumnByName('socialNetworks')) {
            await queryRunner.dropColumn('company', 'socialNetworks');
        }
    }
}
