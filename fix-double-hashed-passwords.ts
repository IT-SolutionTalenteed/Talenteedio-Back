import 'reflect-metadata';
import AppDataSource from './src/database';
import { User } from './src/database/entities';

/**
 * Script pour corriger les mots de passe qui ont été hashés deux fois
 * 
 * Ce script réinitialise les mots de passe des comptes company qui ont été créés
 * avec le bug de double hashage.
 * 
 * Usage:
 * 1. Identifier les comptes affectés (généralement les companies créées via GraphQL)
 * 2. Exécuter ce script avec: npx ts-node fix-double-hashed-passwords.ts
 * 3. Les nouveaux mots de passe seront affichés dans la console
 * 4. Envoyer les nouveaux mots de passe aux utilisateurs concernés
 */

async function fixDoubleHashedPasswords() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        // Liste des emails des comptes affectés
        // Ajoutez ici les emails des comptes qui ne peuvent pas se connecter
        const affectedEmails = [
            'bmw@gmail.com',
            'toyota@gmail.com',
            // Ajoutez d'autres emails si nécessaire
        ];

        console.log(`\n🔍 Recherche de ${affectedEmails.length} compte(s) affecté(s)...\n`);

        for (const email of affectedEmails) {
            const user = await User.findOne({
                where: { email },
                relations: ['company']
            });

            if (!user) {
                console.log(`❌ Utilisateur non trouvé: ${email}`);
                continue;
            }

            // Générer un nouveau mot de passe
            const newPassword = generateSecurePassword();

            // Utiliser setPasswd pour définir le nouveau mot de passe
            // Le hook @BeforeUpdate() va le hasher correctement
            user.setPasswd(newPassword);
            await user.save();

            console.log(`✅ Mot de passe réinitialisé pour: ${email}`);
            console.log(`   Nom: ${user.firstname} ${user.lastname}`);
            console.log(`   Nouveau mot de passe: ${newPassword}`);
            console.log(`   Type de compte: ${user.company ? 'Company' : user.talent ? 'Talent' : user.consultant ? 'Consultant' : 'Autre'}`);
            console.log('');
        }

        console.log('\n✅ Tous les mots de passe ont été réinitialisés avec succès!');
        console.log('\n⚠️  IMPORTANT: Envoyez les nouveaux mots de passe aux utilisateurs concernés.\n');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la correction des mots de passe:', error);
        await AppDataSource.destroy();
        process.exit(1);
    }
}

/**
 * Génère un mot de passe sécurisé
 */
function generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Assurer au moins un caractère de chaque type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Caractère spécial
    
    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Exécuter le script
fixDoubleHashedPasswords();
