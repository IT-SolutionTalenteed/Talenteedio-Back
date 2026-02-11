import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCategoryEnhancedFields1739296800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne gallery
        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'gallery',
                type: 'json',
                isNullable: true,
            })
        );

        // Ajouter la colonne testimonials
        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'testimonials',
                type: 'json',
                isNullable: true,
            })
        );

        // Ajouter la colonne video
        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'video',
                type: 'varchar',
                isNullable: true,
            })
        );

        // Ajouter la colonne detailList
        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'detailList',
                type: 'json',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('category', 'gallery');
        await queryRunner.dropColumn('category', 'testimonials');
        await queryRunner.dropColumn('category', 'video');
        await queryRunner.dropColumn('category', 'detailList');
    }
}
