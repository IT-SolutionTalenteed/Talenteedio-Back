import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionToCompany1709251200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'company',
            new TableColumn({
                name: 'description',
                type: 'text',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('company', 'description');
    }
}
