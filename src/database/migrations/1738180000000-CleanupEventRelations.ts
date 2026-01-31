import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class CleanupEventRelations1738180000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the many-to-many junction table for event categories
        const eventCategoriesTable = await queryRunner.getTable('event_categories_category');
        if (eventCategoriesTable) {
            const foreignKeys = eventCategoriesTable.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('event_categories_category', foreignKey);
            }
            await queryRunner.dropTable('event_categories_category');
        }

        // Drop the eventGroupId foreign key and column
        const eventTable = await queryRunner.getTable('event');
        if (eventTable) {
            const eventGroupForeignKey = eventTable.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('eventGroupId') !== -1
            );
            if (eventGroupForeignKey) {
                await queryRunner.dropForeignKey('event', eventGroupForeignKey);
            }
            await queryRunner.dropColumn('event', 'eventGroupId');
        }

        // Add categoryId column to event table
        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'categoryId',
                type: 'varchar',
                length: '36',
                isNullable: true,
            })
        );

        // Add foreign key for category
        await queryRunner.createForeignKey(
            'event',
            new TableForeignKey({
                columnNames: ['categoryId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'category',
                onDelete: 'SET NULL',
            })
        );

        // Drop event_group table (but keep event_companies_company for many-to-many with companies)
        await queryRunner.dropTable('event_group', true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove category foreign key and column
        const eventTable = await queryRunner.getTable('event');
        if (eventTable) {
            const categoryForeignKey = eventTable.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('categoryId') !== -1
            );
            if (categoryForeignKey) {
                await queryRunner.dropForeignKey('event', categoryForeignKey);
            }
            await queryRunner.dropColumn('event', 'categoryId');
        }

        // Note: We don't recreate event_group and junction tables in down migration
        // as this would be a destructive operation
    }
}
