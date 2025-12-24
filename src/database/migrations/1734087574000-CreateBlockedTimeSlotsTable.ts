import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateBlockedTimeSlotsTable1734087574000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blocked_time_slots',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'consultant_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key
    await queryRunner.createForeignKey(
      'blocked_time_slots',
      new TableForeignKey({
        columnNames: ['consultant_id'],
        referencedTableName: 'consultant',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Index unique pour éviter les doublons
    await queryRunner.createIndex(
      'blocked_time_slots',
      new TableIndex({
        name: 'IDX_blocked_time_slots_consultant_date_time',
        columnNames: ['consultant_id', 'date', 'time'],
        isUnique: true,
      }),
    );

    // Index pour optimiser les requêtes par consultant et date
    await queryRunner.createIndex(
      'blocked_time_slots',
      new TableIndex({
        name: 'IDX_blocked_time_slots_consultant_date',
        columnNames: ['consultant_id', 'date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blocked_time_slots');
  }
}
