import AppDataSource from './src/database';
import { Media } from './src/database/entities';

const fixImageUrls = async () => {
    try {
        console.log('🔧 Connexion à la base de données...');
        await AppDataSource.initialize();
        console.log('✅ Connecté !');

        const mediaRepository = AppDataSource.getRepository(Media);

        // Trouver toutes les images avec des URLs incorrectes
        const incorrectMedias = await mediaRepository
            .createQueryBuilder('media')
            .where('media.fileUrl LIKE :pattern', { pattern: 'http://localhost/public%' })
            .getMany();

        console.log(`\n📊 Trouvé ${incorrectMedias.length} image(s) avec des URLs incorrectes`);

        if (incorrectMedias.length === 0) {
            console.log('✅ Aucune correction nécessaire !');
            process.exit(0);
        }

        // Afficher les URLs avant correction
        console.log('\n📋 URLs à corriger :');
        incorrectMedias.forEach((media, index) => {
            console.log(`${index + 1}. ${media.fileName}`);
            console.log(`   Avant: ${media.fileUrl}`);
            console.log(`   Après: ${media.fileUrl.replace('http://localhost/public', 'http://localhost:8080/public')}`);
        });

        // Demander confirmation
        console.log('\n⚠️  Voulez-vous corriger ces URLs ? (y/n)');
        
        // En mode automatique, on corrige directement
        console.log('🔧 Correction en cours...\n');

        let correctedCount = 0;
        for (const media of incorrectMedias) {
            const oldUrl = media.fileUrl;
            media.fileUrl = media.fileUrl.replace('http://localhost/public', 'http://localhost:8080/public');
            await mediaRepository.save(media);
            console.log(`✅ Corrigé: ${media.fileName}`);
            correctedCount++;
        }

        console.log(`\n🎉 ${correctedCount} URL(s) corrigée(s) avec succès !`);
        console.log('\n✅ Les images devraient maintenant s\'afficher correctement.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

fixImageUrls();
