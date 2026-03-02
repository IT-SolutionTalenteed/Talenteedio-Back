import 'reflect-metadata';
import dotenv from 'dotenv';
import { sendCompanyCredentials } from './src/helpers/mailer/send-company-credentials';

dotenv.config();

/**
 * Script pour envoyer les nouveaux identifiants après réinitialisation
 * 
 * Usage: npx ts-node send-new-credentials.ts
 */

async function sendNewCredentials() {
    try {
        console.log('📧 Envoi des nouveaux identifiants...\n');

        // Liste des comptes à notifier
        const accounts = [
            {
                companyName: 'BMW',
                email: 'bmw@gmail.com',
                password: '$KPysD2mPbx7'
            },
            {
                companyName: 'Toyota',
                email: 'toyota@gmail.com',
                password: '5Mr%MGj7J8@$'
            }
        ];

        for (const account of accounts) {
            const credentials = {
                ...account,
                adminUrl: process.env.ADMIN_HOST || 'http://localhost:5173'
            };

            await sendCompanyCredentials(credentials);

            console.log(`✅ Email envoyé avec succès à: ${credentials.email}`);
            console.log(`   Entreprise: ${credentials.companyName}`);
            console.log(`   Nouveau mot de passe: ${credentials.password}\n`);
        }

        console.log('✅ Tous les emails ont été envoyés avec succès !');
        console.log('\n⚠️  Les utilisateurs doivent changer leur mot de passe à la première connexion.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi des emails:', error);
        process.exit(1);
    }
}

// Exécuter le script
sendNewCredentials();
