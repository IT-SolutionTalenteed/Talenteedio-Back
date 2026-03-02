import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateNewsletterTable1772466176773 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'newsletter',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: '(UUID())',
                    },
                    {
                        name: 'subject',
                        type: 'varchar',
                        length: '500',
                    },
                    {
                        name: 'message',
                        type: 'text',
                    },
                    {
                        name: 'htmlMessage',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
                        default: "'draft'",
                    },
                    {
                        name: 'recipientTypes',
                        type: 'text',
                    },
                    {
                        name: 'customRecipientEmails',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'attachments',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'totalRecipients',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'sentCount',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'failedCount',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'scheduledAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'sentAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'createdById',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'newsletter',
            new TableForeignKey({
                columnNames: ['createdById'],
                referencedColumnNames: ['id'],
                referencedTableName: 'user',
                onDelete: 'CASCADE',
            })
        );

        // Index pour améliorer les performances
        await queryRunner.createIndex(
            'newsletter',
            new TableIndex({
                name: 'IDX_newsletter_status',
                columnNames: ['status'],
            })
        );

        await queryRunner.createIndex(
            'newsletter',
            new TableIndex({
                name: 'IDX_newsletter_createdAt',
                columnNames: ['createdAt'],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('newsletter');
    }
}
