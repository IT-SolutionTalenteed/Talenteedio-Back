import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class RecreateEventCompaniesTable1738181000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
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
    }
}
