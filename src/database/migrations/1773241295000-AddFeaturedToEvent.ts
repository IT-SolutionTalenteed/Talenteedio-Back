import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFeaturedToEvent1773241295000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'featured',
                type: 'boolean',
                default: false,
                isNullable: false,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('event', 'featured');
    }
}
