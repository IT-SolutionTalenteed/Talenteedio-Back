import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCompanyToEvent1738758000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne companyId
        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'companyId',
                type: 'varchar',
                length: '36',
                isNullable: true,
            })
        );

        // Ajouter la clé étrangère
        await queryRunner.createForeignKey(
            'event',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'company',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la clé étrangère
        const table = await queryRunner.getTable('event');
        const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('companyId') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('event', foreignKey);
        }

        // Supprimer la colonne
        await queryRunner.dropColumn('event', 'companyId');
    }
}
