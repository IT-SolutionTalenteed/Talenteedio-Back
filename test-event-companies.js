// Script de test pour vérifier la sauvegarde des companies dans un event
const { DataSource } = require('typeorm');

async function testEventCompanies() {
    console.log('🔍 Test de la relation Event-Companies...\n');
    
    // Simuler la configuration de la base de données
    const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'talenteed',
        entities: ['src/database/entities/*.ts'],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Connexion à la base de données établie\n');

        // Vérifier les companies dans l'event
        const eventId = 'de7175cb-fc0a-46e7-bcb5-60b9677e94be';
        
        const result = await dataSource.query(
            'SELECT * FROM event_companies_company WHERE eventId = ?',
            [eventId]
        );

        console.log(`📊 Nombre de companies dans la table de jonction: ${result.length}`);
        console.log('Détails:', JSON.stringify(result, null, 2));

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

testEventCompanies();
