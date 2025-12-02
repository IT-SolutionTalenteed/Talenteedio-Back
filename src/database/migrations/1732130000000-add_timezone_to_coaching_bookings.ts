import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimezoneToCoachingBookings1732130000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('coaching_bookings');
    const timezoneColumn = table?.findColumnByName('timezone');
    
    if (!timezoneColumn) {
      await queryRunner.addColumn(
        'coaching_bookings',
        new TableColumn({
          name: 'timezone',
          type: 'varchar',
          length: '100',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('coaching_bookings');
    const timezoneColumn = table?.findColumnByName('timezone');
    
    if (timezoneColumn) {
      await queryRunner.dropColumn('coaching_bookings', 'timezone');
    }
  }
}
