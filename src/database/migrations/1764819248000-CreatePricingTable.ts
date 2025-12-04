import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePricingTable1764819248000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'pricing',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'description',
                        type: 'text',
                    },
                    {
                        name: 'price',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'unit',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'consultantId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'pricing',
            new TableForeignKey({
                columnNames: ['consultantId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'consultant',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('pricing');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('consultantId') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('pricing', foreignKey);
            }
        }
        await queryRunner.dropTable('pricing');
    }
}
