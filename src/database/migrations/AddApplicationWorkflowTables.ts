import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddApplicationWorkflowTables1733000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter les nouvelles colonnes à la table Application
        await queryRunner.addColumn(
            'application',
            new TableColumn({
                name: 'matchScore',
                type: 'int',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'application',
            new TableColumn({
                name: 'processingType',
                type: 'enum',
                enum: ['AUTO', 'MANUAL'],
                default: "'MANUAL'",
            })
        );

        await queryRunner.addColumn(
            'application',
            new TableColumn({
                name: 'rejectionReason',
                type: 'text',
                isNullable: true,
            })
        );

        // Créer la table CVTransmissionLog
        await queryRunner.createTable(
            new Table({
                name: 'cv_transmission_log',
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
                        name: 'applicationId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'cvId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'recipientEmail',
                        type: 'varchar',
                    },
                    {
                        name: 'recipientType',
                        type: 'enum',
                        enum: ['CLIENT', 'ADMIN', 'CONSULTANT'],
                    },
                    {
                        name: 'transmissionMethod',
                        type: 'enum',
                        enum: ['EMAIL', 'DOWNLOAD', 'API'],
                    },
                    {
                        name: 'hasWatermark',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'watermarkText',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'transmittedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true
        );

        // Ajouter les foreign keys pour CVTransmissionLog
        await queryRunner.createForeignKey(
            'cv_transmission_log',
            new TableForeignKey({
                columnNames: ['applicationId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'application',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'cv_transmission_log',
            new TableForeignKey({
                columnNames: ['cvId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'cv',
                onDelete: 'CASCADE',
            })
        );

        // Créer la table ApplicationFeedback
        await queryRunner.createTable(
            new Table({
                name: 'application_feedback',
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
                        name: 'applicationId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'reviewedBy',
                        type: 'varchar',
                    },
                    {
                        name: 'reviewerType',
                        type: 'enum',
                        enum: ['ADMIN', 'CLIENT'],
                    },
                    {
                        name: 'matchScoreAccuracy',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'comments',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'criteriaFeedback',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'wasHired',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true
        );

        // Ajouter la foreign key pour ApplicationFeedback
        await queryRunner.createForeignKey(
            'application_feedback',
            new TableForeignKey({
                columnNames: ['applicationId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'application',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les tables
        await queryRunner.dropTable('application_feedback');
        await queryRunner.dropTable('cv_transmission_log');

        // Supprimer les colonnes de Application
        await queryRunner.dropColumn('application', 'matchScore');
        await queryRunner.dropColumn('application', 'processingType');
        await queryRunner.dropColumn('application', 'rejectionReason');
    }
}
