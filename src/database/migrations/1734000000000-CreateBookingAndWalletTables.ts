import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBookingAndWalletTables1734000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Créer la table wallets
        await queryRunner.createTable(
            new Table({
                name: 'wallets',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: '(UUID())',
                    },
                    {
                        name: 'consultantId',
                        type: 'varchar',
                        length: '36',
                        isUnique: true,
                    },
                    {
                        name: 'balance',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'pendingBalance',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'totalEarnings',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        length: '3',
                        default: "'EUR'",
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
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
            true
        );

        // Créer la table bookings
        await queryRunner.createTable(
            new Table({
                name: 'bookings',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: '(UUID())',
                    },
                    {
                        name: 'clientName',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'clientEmail',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'clientPhone',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'clientId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'consultantId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'pricingId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'serviceTitle',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'serviceDescription',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'bookingDate',
                        type: 'date',
                    },
                    {
                        name: 'bookingTime',
                        type: 'time',
                    },
                    {
                        name: 'timezone',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        length: '3',
                        default: "'EUR'",
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
                        default: "'pending'",
                    },
                    {
                        name: 'paymentStatus',
                        type: 'enum',
                        enum: ['pending', 'paid', 'failed', 'refunded'],
                        default: "'pending'",
                    },
                    {
                        name: 'stripeSessionId',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'stripePaymentIntentId',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'frequency',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        isNullable: true,
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
            true
        );

        // Créer la table wallet_transactions
        await queryRunner.createTable(
            new Table({
                name: 'wallet_transactions',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: '(UUID())',
                    },
                    {
                        name: 'walletId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'bookingId',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: ['credit', 'debit', 'pending', 'cancelled'],
                    },
                    {
                        name: 'source',
                        type: 'enum',
                        enum: ['booking', 'withdrawal', 'refund', 'adjustment'],
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                    },
                    {
                        name: 'balanceAfter',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        length: '3',
                        default: "'EUR'",
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'reference',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        // Ajouter les clés étrangères
        await queryRunner.createForeignKey(
            'wallets',
            new TableForeignKey({
                columnNames: ['consultantId'],
                referencedTableName: 'consultant',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'bookings',
            new TableForeignKey({
                columnNames: ['clientId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            })
        );

        await queryRunner.createForeignKey(
            'bookings',
            new TableForeignKey({
                columnNames: ['consultantId'],
                referencedTableName: 'consultant',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'bookings',
            new TableForeignKey({
                columnNames: ['pricingId'],
                referencedTableName: 'pricing',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            })
        );

        await queryRunner.createForeignKey(
            'wallet_transactions',
            new TableForeignKey({
                columnNames: ['walletId'],
                referencedTableName: 'wallets',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'wallet_transactions',
            new TableForeignKey({
                columnNames: ['bookingId'],
                referencedTableName: 'bookings',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            })
        );

        // Ajouter des index pour les performances
        await queryRunner.query(`CREATE INDEX IDX_bookings_consultant_date ON bookings (consultantId, bookingDate)`);
        await queryRunner.query(`CREATE INDEX IDX_bookings_status ON bookings (status)`);
        await queryRunner.query(`CREATE INDEX IDX_bookings_payment_status ON bookings (paymentStatus)`);
        await queryRunner.query(`CREATE INDEX IDX_wallet_transactions_wallet_created ON wallet_transactions (walletId, createdAt)`);
        await queryRunner.query(`CREATE INDEX IDX_wallet_transactions_type ON wallet_transactions (type)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les tables dans l'ordre inverse
        await queryRunner.dropTable('wallet_transactions');
        await queryRunner.dropTable('bookings');
        await queryRunner.dropTable('wallets');
    }
}