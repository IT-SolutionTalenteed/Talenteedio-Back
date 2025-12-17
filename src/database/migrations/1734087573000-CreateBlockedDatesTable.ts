import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateBlockedDatesTable1734087573000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blocked_dates',
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
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key
    await queryRunner.createForeignKey(
      'blocked_dates',
      new TableForeignKey({
        columnNames: ['consultant_id'],
        referencedTableName: 'consultant',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Index pour optimiser les requêtes
    await queryRunner.createIndex(
      'blocked_dates',
      new TableIndex({
        name: 'IDX_blocked_dates_consultant_date',
        columnNames: ['consultant_id', 'date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blocked_dates');
  }
}
