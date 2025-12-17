import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGoogleIdToUser1703000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Vérifier si la colonne existe déjà
        const table = await queryRunner.getTable('user');
        const googleIdColumn = table?.findColumnByName('googleId');

        if (!googleIdColumn) {
            await queryRunner.addColumn('user', new TableColumn({
                name: 'googleId',
                type: 'varchar',
                isNullable: true,
                isUnique: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('user');
        const googleIdColumn = table?.findColumnByName('googleId');

        if (googleIdColumn) {
            await queryRunner.dropColumn('user', 'googleId');
        }
    }
}