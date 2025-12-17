import 'reflect-metadata';
import AppDataSource from './src/database';
import { AddGoogleIdToUser1703000000000 } from './src/migration/add-google-id-to-user';

async function runMigration() {
    try {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        
        console.log('Running Google ID migration...');
        const migration = new AddGoogleIdToUser1703000000000();
        const queryRunner = AppDataSource.createQueryRunner();
        
        await migration.up(queryRunner);
        
        console.log('Migration completed successfully!');
        
        await queryRunner.release();
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();