import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateBlockedTimeSlotsTable1734087574000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blocked_time_slots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'consultant_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'time',
            type: 'time',
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

    // Index unique pour éviter les doublons
    await queryRunner.createIndex(
      'blocked_time_slots',
      new Index('IDX_blocked_time_slots_consultant_date_time', ['consultant_id', 'date', 'time'], {
        unique: true,
      }),
    );

    // Index pour optimiser les requêtes par consultant et date
    await queryRunner.createIndex(
      'blocked_time_slots',
      new Index('IDX_blocked_time_slots_consultant_date', ['consultant_id', 'date']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blocked_time_slots');
  }
}