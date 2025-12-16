import AppDataSource from './src/database';

async function runBlockedTimeSlotsTable() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('Creating blocked_time_slots table...');
    
    // Créer la table manuellement
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS blocked_time_slots (
        id varchar(36) NOT NULL DEFAULT (UUID()),
        consultant_id varchar(255) NOT NULL,
        date date NOT NULL,
        time time NOT NULL,
        reason text NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY IDX_blocked_time_slots_consultant_date_time (consultant_id, date, time),
        KEY IDX_blocked_time_slots_consultant_date (consultant_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('Table blocked_time_slots created successfully!');
    
    await AppDataSource.destroy();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

runBlockedTimeSlotsTable();