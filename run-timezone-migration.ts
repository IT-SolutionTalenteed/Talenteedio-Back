import AppDataSource from './src/database';
import { AddTimezoneToCoachingBookings1732130000000 } from './src/database/migrations/1732130000000-add_timezone_to_coaching_bookings';

async function runMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('🔄 Running migration: AddTimezoneToCoachingBookings...');
    const migration = new AddTimezoneToCoachingBookings1732130000000();
    await migration.up(queryRunner);
    console.log('✅ Migration completed successfully!');

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
