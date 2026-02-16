import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMatchingProfileTables1739750000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Table MatchingProfile
        await queryRunner.createTable(
            new Table({
                name: 'matching_profile',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'cvId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'cvText',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'interests',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'skills',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'currentSectorId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'targetSectorIds',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['draft', 'active', 'completed', 'archived'],
                        default: "'draft'",
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Foreign keys pour MatchingProfile
        await queryRunner.createForeignKey(
            'matching_profile',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'matching_profile',
            new TableForeignKey({
                columnNames: ['cvId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'media',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'matching_profile',
            new TableForeignKey({
                columnNames: ['currentSectorId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'category',
                onDelete: 'SET NULL',
            }),
        );

        // Table CompanyMatch
        await queryRunner.createTable(
            new Table({
                name: 'company_match',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'matchingProfileId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'companyId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'matchScore',
                        type: 'float',
                        default: 0,
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
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Index unique pour éviter les doublons
        await queryRunner.createIndex(
            'company_match',
            new TableIndex({
                name: 'IDX_matching_profile_company',
                columnNames: ['matchingProfileId', 'companyId'],
                isUnique: true,
            }),
        );

        // Foreign keys pour CompanyMatch
        await queryRunner.createForeignKey(
            'company_match',
            new TableForeignKey({
                columnNames: ['matchingProfileId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'matching_profile',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'company_match',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'company',
                onDelete: 'CASCADE',
            }),
        );

        // Table CompanyAppointment
        await queryRunner.createTable(
            new Table({
                name: 'company_appointment',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'matchingProfileId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'companyId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'appointmentDate',
                        type: 'date',
                    },
                    {
                        name: 'appointmentTime',
                        type: 'varchar',
                        length: '10',
                    },
                    {
                        name: 'timezone',
                        type: 'varchar',
                        length: '100',
                        default: "'Europe/Paris'",
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'companyNotes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
                        default: "'pending'",
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Foreign keys pour CompanyAppointment
        await queryRunner.createForeignKey(
            'company_appointment',
            new TableForeignKey({
                columnNames: ['matchingProfileId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'matching_profile',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'company_appointment',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'company',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'company_appointment',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('company_appointment');
        await queryRunner.dropTable('company_match');
        await queryRunner.dropTable('matching_profile');
    }
}
