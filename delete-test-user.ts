import 'reflect-metadata';
import dotenv from 'dotenv';
import AppDataSource from './src/database';
import { User } from './src/database/entities';

dotenv.config();

async function deleteTestUser() {
    try {
        console.log('Connexion à la base de données...');
        await AppDataSource.initialize();
        
        const email = 'zawarudo@gmail.com';
        console.log(`Recherche de l'utilisateur avec l'email: ${email}`);
        
        const user = await User.findOne({ 
            where: { email },
            relations: ['company']
        });
        
        if (user) {
            console.log(`Utilisateur trouvé: ${user.firstname} ${user.lastname}`);
            
            // Supprimer l'utilisateur (cascade supprimera la company)
            await user.remove();
            
            console.log('✅ Utilisateur supprimé avec succès');
        } else {
            console.log('❌ Aucun utilisateur trouvé avec cet email');
        }
        
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

deleteTestUser();
