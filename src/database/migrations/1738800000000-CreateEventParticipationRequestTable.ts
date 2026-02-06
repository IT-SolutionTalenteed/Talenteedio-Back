import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEventParticipationRequestTable1738800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'event_participation_request',
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
                        name: 'eventId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'companyId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['PENDING', 'APPROVED', 'REJECTED'],
                        default: "'PENDING'",
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'adminNote',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'reviewedById',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'reviewedAt',
                        type: 'timestamp',
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

        await queryRunner.createForeignKey(
            'event_participation_request',
            new TableForeignKey({
                columnNames: ['eventId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'event',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'event_participation_request',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'company',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'event_participation_request',
            new TableForeignKey({
                columnNames: ['reviewedById'],
                referencedColumnNames: ['id'],
                referencedTableName: 'admin',
                onDelete: 'SET NULL',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('event_participation_request');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('event_participation_request', foreignKey);
            }
        }
        await queryRunner.dropTable('event_participation_request');
    }
}
