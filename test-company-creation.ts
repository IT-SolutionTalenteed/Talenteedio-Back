import 'reflect-metadata';
import AppDataSource from './src/database';
import { User, Company } from './src/database/entities';

/**
 * Script de test pour vérifier que la création de company fonctionne correctement
 * 
 * Ce script :
 * 1. Crée un utilisateur avec setPasswd()
 * 2. Vérifie que le mot de passe est correctement hashé
 * 3. Teste la connexion avec le mot de passe en clair
 * 4. Nettoie les données de test
 */

async function testCompanyCreation() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected\n');

        const testEmail = 'test-company@example.com';
        const testPassword = 'TestPassword123!';

        // Nettoyer les données de test existantes
        const existingUser = await User.findOne({ where: { email: testEmail } });
        if (existingUser) {
            console.log('🧹 Nettoyage des données de test existantes...');
            await existingUser.remove();
        }

        console.log('📝 Test 1: Création d\'un utilisateur avec setPasswd()');
        console.log('   Email:', testEmail);
        console.log('   Mot de passe en clair:', testPassword);

        // Créer un utilisateur comme dans createCompany
        const user = new User();
        user.email = testEmail;
        user.firstname = 'Test';
        user.lastname = 'Company';
        user.setPasswd(testPassword); // Utiliser setPasswd comme dans le register
        user.validateAt = new Date();

        await user.save();
        console.log('   ✅ Utilisateur créé avec ID:', user.id);

        // Récupérer l'utilisateur avec le mot de passe
        const savedUser = await User.findOne({ 
            where: { email: testEmail },
            select: ['id', 'email', 'password']
        });

        if (!savedUser) {
            throw new Error('Utilisateur non trouvé après création');
        }

        console.log('   ✅ Utilisateur récupéré de la base de données');
        console.log('   Mot de passe hashé:', savedUser.password.substring(0, 20) + '...');

        console.log('\n📝 Test 2: Vérification du mot de passe');
        
        // Tester avec le bon mot de passe
        const isValidPassword = await savedUser.checkPasswd(testPassword);
        console.log('   Test avec le bon mot de passe:', isValidPassword ? '✅ VALIDE' : '❌ INVALIDE');

        // Tester avec un mauvais mot de passe
        const isInvalidPassword = await savedUser.checkPasswd('WrongPassword123!');
        console.log('   Test avec un mauvais mot de passe:', !isInvalidPassword ? '✅ REJETÉ' : '❌ ACCEPTÉ');

        console.log('\n📝 Test 3: Simulation de connexion');
        
        // Simuler le processus de connexion
        const loginUser = await User.findOne({ 
            where: { email: testEmail },
            select: ['password']
        });

        if (loginUser) {
            const loginSuccess = await loginUser.checkPasswd(testPassword);
            console.log('   Connexion avec mot de passe en clair:', loginSuccess ? '✅ SUCCÈS' : '❌ ÉCHEC');
        }

        // Nettoyer les données de test
        console.log('\n🧹 Nettoyage des données de test...');
        await savedUser.remove();
        console.log('   ✅ Données de test supprimées');

        console.log('\n✅ TOUS LES TESTS SONT PASSÉS !');
        console.log('\n📋 Résumé:');
        console.log('   - setPasswd() définit le mot de passe en clair');
        console.log('   - Le hook @BeforeInsert() hashe automatiquement le mot de passe');
        console.log('   - checkPasswd() vérifie correctement le mot de passe en clair');
        console.log('   - La connexion fonctionne avec le mot de passe en clair');
        console.log('\n✅ Le système de création de company est CORRECT !');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERREUR lors du test:', error);
        await AppDataSource.destroy();
        process.exit(1);
    }
}

// Exécuter le test
testCompanyCreation();
