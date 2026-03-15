import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEndDateToEvent1710000000000 implements MigrationInterface {
    name = 'AddEndDateToEvent1710000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'endDate',
                type: 'date',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('event', 'endDate');
    }
}