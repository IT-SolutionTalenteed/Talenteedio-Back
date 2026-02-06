import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCategoryFields1738800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'subtitle',
                type: 'varchar',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'description',
                type: 'text',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'image',
                type: 'varchar',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'faq',
                type: 'json',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('category', 'subtitle');
        await queryRunner.dropColumn('category', 'description');
        await queryRunner.dropColumn('category', 'image');
        await queryRunner.dropColumn('category', 'faq');
    }
}
