import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCoachingBookings1732120000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'coaching_bookings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'consultant',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'serviceType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'bookingDate',
            type: 'date',
          },
          {
            name: 'bookingTime',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'frequency',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'int',
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
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('coaching_bookings');
  }
}
