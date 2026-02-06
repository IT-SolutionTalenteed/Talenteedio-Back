import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEventUserReservationTable1738800001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'event_user_reservation',
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
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'companyStandId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['CONFIRMED', 'CANCELLED'],
                        default: "'CONFIRMED'",
                    },
                    {
                        name: 'notes',
                        type: 'text',
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
            'event_user_reservation',
            new TableForeignKey({
                columnNames: ['eventId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'event',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'event_user_reservation',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'event_user_reservation',
            new TableForeignKey({
                columnNames: ['companyStandId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'company',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('event_user_reservation');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('event_user_reservation', foreignKey);
            }
        }
        await queryRunner.dropTable('event_user_reservation');
    }
}
