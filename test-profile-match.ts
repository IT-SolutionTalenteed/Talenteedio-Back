import 'reflect-metadata';
import AppDataSource from './src/database';
import { ProfileMatchResult } from './src/database/entities/ProfileMatchResult';

async function testProfileMatchResults() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const matchResults = await ProfileMatchResult.find({
            take: 5,
            order: { createdAt: 'DESC' },
        });

        console.log(`\n📊 Found ${matchResults.length} profile match results:\n`);

        for (const result of matchResults) {
            console.log('─────────────────────────────────────');
            console.log(`ID: ${result.id}`);
            console.log(`CV ID: ${result.cvId}`);
            console.log(`Job ID: ${result.jobId}`);
            console.log(`Created: ${result.createdAt}`);
            console.log('\nPython Return Data:');
            console.log(JSON.stringify(result.pythonReturn, null, 2));
            console.log('─────────────────────────────────────\n');
        }

        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testProfileMatchResults();
