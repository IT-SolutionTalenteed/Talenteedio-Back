import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm"

export class CleanupFavoriteTable1770097171887 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Supprimer la foreign key sur freelanceId
        const table = await queryRunner.getTable('favorite');
        const freelanceForeignKey = table?.foreignKeys.find(
            fk => fk.columnNames.indexOf('freelanceId') !== -1
        );
        
        if (freelanceForeignKey) {
            await queryRunner.dropForeignKey('favorite', freelanceForeignKey);
        }

        // 2. Supprimer l'index unique sur (userId, freelanceId)
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_UNIQUE_USER_FREELANCE ON favorite`);

        // 3. Supprimer la colonne freelanceId
        await queryRunner.dropColumn('favorite', 'freelanceId');

        // 4. Rendre jobId NOT NULL (car maintenant tout est un job)
        await queryRunner.changeColumn(
            'favorite',
            'jobId',
            new TableColumn({
                name: 'jobId',
                type: 'varchar',
                length: '36',
                isNullable: false, // Plus nullable
            })
        );

        // 5. Mettre à jour l'index unique pour (userId, jobId)
        await queryRunner.query(`
            DROP INDEX IF EXISTS IDX_UNIQUE_USER_JOB ON favorite
        `);
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX IDX_UNIQUE_USER_JOB ON favorite (userId, jobId)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback: recréer la colonne freelanceId
        await queryRunner.addColumn(
            'favorite',
            new TableColumn({
                name: 'freelanceId',
                type: 'varchar',
                length: '36',
                isNullable: true,
            })
        );

        // Recréer la foreign key
        await queryRunner.createForeignKey(
            'favorite',
            new TableForeignKey({
                columnNames: ['freelanceId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'freelance',
                onDelete: 'CASCADE',
            })
        );

        // Recréer l'index unique
        await queryRunner.query(`
            CREATE UNIQUE INDEX IDX_UNIQUE_USER_FREELANCE 
            ON favorite (userId, freelanceId)
        `);

        // Rendre jobId nullable à nouveau
        await queryRunner.changeColumn(
            'favorite',
            'jobId',
            new TableColumn({
                name: 'jobId',
                type: 'varchar',
                length: '36',
                isNullable: true,
            })
        );
    }

}
