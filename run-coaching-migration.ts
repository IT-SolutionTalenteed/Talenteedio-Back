import AppDataSource from './src/database';
import { CreateCoachingBookings1732120000000 } from './src/database/migrations/1732120000000-create_coaching_bookings';

async function runMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('🔄 Running migration: CreateCoachingBookings...');
    const migration = new CreateCoachingBookings1732120000000();
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
