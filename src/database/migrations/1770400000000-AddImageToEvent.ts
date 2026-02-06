import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImageToEvent1770400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'event',
            new TableColumn({
                name: 'image',
                type: 'varchar',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('event', 'image');
    }
}
