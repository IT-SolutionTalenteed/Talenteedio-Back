import AppDataSource from './src/database';

async function verifyTable() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Vérifier si la table existe
    const tableExists = await queryRunner.hasTable('coaching_bookings');
    console.log(`\n📋 Table 'coaching_bookings' exists: ${tableExists ? '✅ YES' : '❌ NO'}`);

    if (tableExists) {
      // Récupérer la structure de la table
      const table = await queryRunner.getTable('coaching_bookings');
      console.log('\n📊 Table structure:');
      console.log('Columns:');
      table?.columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type}) ${col.isNullable ? 'NULL' : 'NOT NULL'}`);
      });
    }

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('\n✅ Verification complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyTable();
