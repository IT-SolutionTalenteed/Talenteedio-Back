import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateFavoriteTable1738598400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'favorite',
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
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'jobId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'freelanceId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: ['job', 'freelance'],
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Foreign key for user
        await queryRunner.createForeignKey(
            'favorite',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            }),
        );

        // Foreign key for job
        await queryRunner.createForeignKey(
            'favorite',
            new TableForeignKey({
                columnNames: ['jobId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'job',
                onDelete: 'CASCADE',
            }),
        );

        // Foreign key for freelance
        await queryRunner.createForeignKey(
            'favorite',
            new TableForeignKey({
                columnNames: ['freelanceId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'freelance',
                onDelete: 'CASCADE',
            }),
        );

        // Unique constraint for user + job
        await queryRunner.createIndex(
            'favorite',
            new TableIndex({
                name: 'IDX_UNIQUE_USER_JOB',
                columnNames: ['userId', 'jobId'],
                isUnique: true,
                where: 'jobId IS NOT NULL',
            }),
        );

        // Unique constraint for user + freelance
        await queryRunner.createIndex(
            'favorite',
            new TableIndex({
                name: 'IDX_UNIQUE_USER_FREELANCE',
                columnNames: ['userId', 'freelanceId'],
                isUnique: true,
                where: 'freelanceId IS NOT NULL',
            }),
        );

        // Index for faster queries
        await queryRunner.createIndex(
            'favorite',
            new TableIndex({
                name: 'IDX_FAVORITE_USER',
                columnNames: ['userId'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('favorite');
    }
}
