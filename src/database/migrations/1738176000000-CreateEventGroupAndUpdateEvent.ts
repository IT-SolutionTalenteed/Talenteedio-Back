import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from 'typeorm';

export class CreateEventGroupAndUpdateEvent1738176000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create EventGroup table
        await queryRunner.createTable(
            new Table({
                name: 'event_group',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                    },
                    {
                        name: 'slug',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['active', 'inactive'],
                        default: "'active'",
                    },
                    {
                        name: 'color',
                        type: 'varchar',
                        length: '7',
                        isNullable: true,
                    },
                    {
                        name: 'icon',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
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

        // Add new columns to Event table
        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'startTime',
                type: 'time',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'endTime',
                type: 'time',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'location',
                type: 'varchar',
                length: '255',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'maxParticipants',
                type: 'int',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'eventGroupId',
                type: 'varchar',
                length: '36',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'updatedAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            })
        );

        // Add foreign key for eventGroup
        await queryRunner.createForeignKey(
            'event',
            new TableForeignKey({
                columnNames: ['eventGroupId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'event_group',
                onDelete: 'SET NULL',
            })
        );

        // Create junction table for Event and Company (many-to-many)
        await queryRunner.createTable(
            new Table({
                name: 'event_companies_company',
                columns: [
                    {
                        name: 'eventId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'companyId',
                        type: 'varchar',
                        length: '36',
                    },
                ],
            }),
            true
        );

        // Add foreign keys for junction table
        await queryRunner.createForeignKey(
            'event_companies_company',
            new TableForeignKey({
                columnNames: ['eventId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'event',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'event_companies_company',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'company',
                onDelete: 'CASCADE',
            })
        );

        // Create indexes for better performance
        await queryRunner.query(
            `CREATE INDEX IDX_event_companies_company_eventId ON event_companies_company (eventId)`
        );
        await queryRunner.query(
            `CREATE INDEX IDX_event_companies_company_companyId ON event_companies_company (companyId)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IDX_event_companies_company_eventId ON event_companies_company`);
        await queryRunner.query(`DROP INDEX IDX_event_companies_company_companyId ON event_companies_company`);

        // Drop junction table
        const eventCompaniesTable = await queryRunner.getTable('event_companies_company');
        if (eventCompaniesTable) {
            const foreignKeys = eventCompaniesTable.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('event_companies_company', foreignKey);
            }
        }
        await queryRunner.dropTable('event_companies_company');

        // Drop foreign key from event table
        const eventTable = await queryRunner.getTable('event');
        if (eventTable) {
            const eventGroupForeignKey = eventTable.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('eventGroupId') !== -1
            );
            if (eventGroupForeignKey) {
                await queryRunner.dropForeignKey('event', eventGroupForeignKey);
            }
        }

        // Drop columns from event table
        await queryRunner.dropColumn('event', 'updatedAt');
        await queryRunner.dropColumn('event', 'eventGroupId');
        await queryRunner.dropColumn('event', 'maxParticipants');
        await queryRunner.dropColumn('event', 'location');
        await queryRunner.dropColumn('event', 'endTime');
        await queryRunner.dropColumn('event', 'startTime');

        // Drop EventGroup table
        await queryRunner.dropTable('event_group');
    }
}
