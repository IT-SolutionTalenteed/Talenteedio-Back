import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateJobMatchTable1735900000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'job_match',
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
                        name: 'matchingProfileId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'jobId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'matchScore',
                        type: 'float',
                    },
                    {
                        name: 'matchDetails',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'isSelected',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'job_match',
            new TableForeignKey({
                columnNames: ['matchingProfileId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'matching_profile',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'job_match',
            new TableForeignKey({
                columnNames: ['jobId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'job',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('job_match');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('job_match', foreignKey);
            }
        }
        await queryRunner.dropTable('job_match');
    }
}
