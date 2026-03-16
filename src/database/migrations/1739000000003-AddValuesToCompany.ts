import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddValuesToCompany1739000000003 implements MigrationInterface {
    name = 'AddValuesToCompany1739000000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Créer la table de liaison company_values_value
        await queryRunner.createTable(
            new Table({
                name: 'company_values_value',
                columns: [
                    {
                        name: 'companyId',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'valueId',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['companyId'],
                        referencedTableName: 'company',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['valueId'],
                        referencedTableName: 'value',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
                indices: [
                    {
                        name: 'IDX_COMPANY_VALUES_COMPANY',
                        columnNames: ['companyId'],
                    },
                    {
                        name: 'IDX_COMPANY_VALUES_VALUE',
                        columnNames: ['valueId'],
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la table (les index seront supprimés automatiquement)
        await queryRunner.dropTable('company_values_value');
    }
}