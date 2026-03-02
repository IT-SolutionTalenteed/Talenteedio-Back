import 'reflect-metadata';
import AppDataSource from './src/database';
import { User, Company, Permission, Contact, Address } from './src/database/entities';

/**
 * Script pour créer un compte company de test permanent
 * 
 * Ce compte restera dans la base de données pour tester la connexion
 */

async function createTestCompany() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected\n');

        const testEmail = 'test-company@example.com';
        const testPassword = 'TestPassword123!';
        const companyName = 'Test Company';

        // Vérifier si le compte existe déjà
        let existingUser = await User.findOne({ 
            where: { email: testEmail },
            relations: ['company']
        });

        if (existingUser) {
            console.log('⚠️  Un compte avec cet email existe déjà');
            console.log('   Email:', testEmail);
            
            // Réinitialiser le mot de passe
            console.log('\n🔄 Réinitialisation du mot de passe...');
            existingUser.setPasswd(testPassword);
            await existingUser.save();
            
            console.log('   ✅ Mot de passe réinitialisé');
            console.log('\n📋 Identifiants du compte:');
            console.log('   Email:', testEmail);
            console.log('   Mot de passe:', testPassword);
            console.log('   URL de connexion: http://localhost:5173/authentication/sign-in');
            
            await AppDataSource.destroy();
            process.exit(0);
        }

        console.log('📝 Création d\'un nouveau compte company de test...');
        console.log('   Email:', testEmail);
        console.log('   Mot de passe:', testPassword);
        console.log('   Entreprise:', companyName);

        // Créer l'utilisateur
        const user = new User();
        user.email = testEmail;
        user.firstname = 'Test';
        user.lastname = 'Company';
        user.setPasswd(testPassword); // Utiliser setPasswd comme dans createCompany
        user.validateAt = new Date();

        // Récupérer la permission par défaut
        const permission = await Permission.findOne({ 
            where: { title: 'Initial Package' } 
        });

        if (!permission) {
            throw new Error('Permission par défaut non trouvée. Exécutez les seeds de la base de données.');
        }

        // Créer l'adresse
        const address = new Address();
        address.line = '123 Test Street';
        address.city = 'Test City';
        address.postalCode = '12345';
        address.country = 'Test Country';
        await address.save();

        // Créer le contact
        const contact = new Contact();
        contact.email = testEmail;
        contact.phoneNumber = '+1234567890';
        contact.address = address;
        await contact.save();

        // Créer la company
        const company = new Company();
        company.company_name = companyName;
        company.contact = contact;
        company.permission = permission;
        company.status = 'active';
        await company.save();

        // Lier l'utilisateur à la company
        user.company = company;
        await user.save();

        console.log('\n✅ Compte créé avec succès !');
        console.log('   User ID:', user.id);
        console.log('   Company ID:', company.id);

        // Tester la connexion
        console.log('\n📝 Test de vérification du mot de passe...');
        const savedUser = await User.findOne({ 
            where: { email: testEmail },
            select: ['id', 'email', 'password']
        });

        if (savedUser) {
            const isValid = await savedUser.checkPasswd(testPassword);
            console.log('   Vérification:', isValid ? '✅ VALIDE' : '❌ INVALIDE');
        }

        console.log('\n📋 Identifiants du compte:');
        console.log('   Email:', testEmail);
        console.log('   Mot de passe:', testPassword);
        console.log('   URL de connexion: http://localhost:5173/authentication/sign-in');
        
        console.log('\n✅ Vous pouvez maintenant tester la connexion avec ces identifiants !');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERREUR lors de la création du compte:', error);
        await AppDataSource.destroy();
        process.exit(1);
    }
}

// Exécuter le script
createTestCompany();
