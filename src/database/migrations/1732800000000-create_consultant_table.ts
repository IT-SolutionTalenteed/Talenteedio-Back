import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateConsultantTable1732800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'consultant',
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
                        name: 'title',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['public', 'private', 'draft'],
                        default: "'public'",
                    },
                    {
                        name: 'tjm',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'annualSalary',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'mobility',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'availabilityDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'desiredLocation',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'workMode',
                        type: 'enum',
                        enum: ['remote', 'hybrid', 'onsite'],
                        isNullable: true,
                    },
                    {
                        name: 'expertise',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'yearsOfExperience',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'roleId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'categoryId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'contactId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        // Foreign key for user
        await queryRunner.createForeignKey(
            'consultant',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            })
        );

        // Foreign key for role
        await queryRunner.createForeignKey(
            'consultant',
            new TableForeignKey({
                columnNames: ['roleId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'role',
                onDelete: 'SET NULL',
            })
        );

        // Foreign key for category
        await queryRunner.createForeignKey(
            'consultant',
            new TableForeignKey({
                columnNames: ['categoryId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'category',
                onDelete: 'SET NULL',
            })
        );

        // Foreign key for contact
        await queryRunner.createForeignKey(
            'consultant',
            new TableForeignKey({
                columnNames: ['contactId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'contact',
                onDelete: 'CASCADE',
            })
        );

        // Create consultant_values_value junction table
        await queryRunner.createTable(
            new Table({
                name: 'consultant_values_value',
                columns: [
                    {
                        name: 'consultantId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'valueId',
                        type: 'varchar',
                        length: '36',
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'consultant_values_value',
            new TableForeignKey({
                columnNames: ['consultantId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'consultant',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'consultant_values_value',
            new TableForeignKey({
                columnNames: ['valueId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'value',
                onDelete: 'CASCADE',
            })
        );

        // Add consultantId to application table
        await queryRunner.query(`
            ALTER TABLE application 
            ADD COLUMN consultantId VARCHAR(36) NULL
        `);

        await queryRunner.createForeignKey(
            'application',
            new TableForeignKey({
                columnNames: ['consultantId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'consultant',
                onDelete: 'CASCADE',
            })
        );

        // Add consultantId to cv table
        await queryRunner.query(`
            ALTER TABLE cv 
            ADD COLUMN consultantId VARCHAR(36) NULL
        `);

        await queryRunner.createForeignKey(
            'cv',
            new TableForeignKey({
                columnNames: ['consultantId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'consultant',
                onDelete: 'CASCADE',
            })
        );

        // Add consultantId to lm table
        await queryRunner.query(`
            ALTER TABLE lm 
            ADD COLUMN consultantId VARCHAR(36) NULL
        `);

        await queryRunner.createForeignKey(
            'lm',
            new TableForeignKey({
                columnNames: ['consultantId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'consultant',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys and columns from related tables
        const applicationTable = await queryRunner.getTable('application');
        const applicationForeignKey = applicationTable?.foreignKeys.find((fk) => fk.columnNames.indexOf('consultantId') !== -1);
        if (applicationForeignKey) {
            await queryRunner.dropForeignKey('application', applicationForeignKey);
        }
        await queryRunner.query(`ALTER TABLE application DROP COLUMN consultantId`);

        const cvTable = await queryRunner.getTable('cv');
        const cvForeignKey = cvTable?.foreignKeys.find((fk) => fk.columnNames.indexOf('consultantId') !== -1);
        if (cvForeignKey) {
            await queryRunner.dropForeignKey('cv', cvForeignKey);
        }
        await queryRunner.query(`ALTER TABLE cv DROP COLUMN consultantId`);

        const lmTable = await queryRunner.getTable('lm');
        const lmForeignKey = lmTable?.foreignKeys.find((fk) => fk.columnNames.indexOf('consultantId') !== -1);
        if (lmForeignKey) {
            await queryRunner.dropForeignKey('lm', lmForeignKey);
        }
        await queryRunner.query(`ALTER TABLE lm DROP COLUMN consultantId`);

        // Drop junction table
        await queryRunner.dropTable('consultant_values_value');

        // Drop consultant table
        await queryRunner.dropTable('consultant');
    }
}
