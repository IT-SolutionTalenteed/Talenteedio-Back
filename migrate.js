const { execSync } = require('child_process');

console.log('Running TypeScript migrations...');

try {
    // Utilise ts-node pour exécuter directement le script TypeScript
    execSync('npx ts-node -e "' +
        'import AppDataSource from \\"./src/database/index\\"; ' +
        'AppDataSource.initialize().then(() => { ' +
        '  console.log(\\"Database connected\\"); ' +
        '  return AppDataSource.runMigrations(); ' +
        '}).then((migrations) => { ' +
        '  if (migrations.length === 0) { ' +
        '    console.log(\\"No migrations to run\\"); ' +
        '  } else { ' +
        '    console.log(\\"Successfully ran migrations:\\"); ' +
        '    migrations.forEach(m => console.log(\\"  - \\" + m.name)); ' +
        '  } ' +
        '  return AppDataSource.destroy(); ' +
        '}).then(() => { ' +
        '  console.log(\\"Migration completed\\"); ' +
        '  process.exit(0); ' +
        '}).catch(error => { ' +
        '  console.error(\\"Migration error:\\", error.message); ' +
        '  process.exit(1); ' +
        '});' +
        '"', { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to run migrations:', error.message);
    process.exit(1);
}