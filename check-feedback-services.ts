import AppDataSource from './src/database';
import { CompanyAppointment, AppointmentStatus } from './src/database/entities/CompanyAppointment';

async function checkServices() {
  try {
    console.log('🔍 Vérification des Services de Feedback\n');
    console.log('='.repeat(60));
    
    await AppDataSource.initialize();
    console.log('✅ Connexion à la base de données établie\n');

    // Vérifier la structure de la table
    console.log('📋 Vérification de la structure de la table...');
    
    const metadata = AppDataSource.getMetadata(CompanyAppointment);
    const feedbackColumns = [
      'feedbackEmailSent',
      'feedbackSubmitted',
      'candidateFeedback',
      'candidateDecision',
      'candidateRating',
      'feedbackSubmittedAt'
    ];

    console.log('\nColonnes de feedback:');
    feedbackColumns.forEach(colName => {
      const column = metadata.columns.find(col => col.propertyName === colName);
      if (column) {
        console.log(`   ✅ ${colName} (${column.type})`);
      } else {
        console.log(`   ❌ ${colName} - MANQUANTE !`);
      }
    });

    const allColumnsPresent = feedbackColumns.every(colName => 
      metadata.columns.some(col => col.propertyName === colName)
    );

    if (!allColumnsPresent) {
      console.log('\n⚠️  ATTENTION: Certaines colonnes sont manquantes !');
      console.log('   Exécutez la migration:');
      console.log('   npm run typeorm migration:run\n');
      await AppDataSource.destroy();
      process.exit(1);
    }

    console.log('\n✅ Toutes les colonnes de feedback sont présentes\n');

    // Vérifier les rendez-vous
    console.log('='.repeat(60));
    console.log('📊 État des Rendez-vous\n');

    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0,
      withFeedbackEmail: 0,
      withFeedback: 0,
    };

    const appointments = await CompanyAppointment.find();
    stats.total = appointments.length;

    appointments.forEach(apt => {
      switch (apt.status) {
        case AppointmentStatus.PENDING:
          stats.pending++;
          break;
        case AppointmentStatus.CONFIRMED:
          stats.confirmed++;
          break;
        case AppointmentStatus.REJECTED:
          stats.rejected++;
          break;
        case AppointmentStatus.CANCELLED:
          stats.cancelled++;
          break;
        case AppointmentStatus.COMPLETED:
          stats.completed++;
          break;
      }
      
      if (apt.feedbackEmailSent) stats.withFeedbackEmail++;
      if (apt.feedbackSubmitted) stats.withFeedback++;
    });

    console.log('Statistiques:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   - En attente: ${stats.pending}`);
    console.log(`   - Confirmés: ${stats.confirmed}`);
    console.log(`   - Rejetés: ${stats.rejected}`);
    console.log(`   - Annulés: ${stats.cancelled}`);
    console.log(`   - Terminés: ${stats.completed}`);
    console.log(`   - Email feedback envoyé: ${stats.withFeedbackEmail}`);
    console.log(`   - Feedback soumis: ${stats.withFeedback}\n`);

    // Vérifier les rendez-vous éligibles
    console.log('='.repeat(60));
    console.log('🎯 Rendez-vous Éligibles pour Feedback\n');

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const confirmedAppointments = appointments.filter(
      apt => apt.status === AppointmentStatus.CONFIRMED && !apt.feedbackEmailSent
    );

    console.log(`Rendez-vous confirmés sans email de feedback: ${confirmedAppointments.length}\n`);

    if (confirmedAppointments.length > 0) {
      let eligibleCount = 0;
      
      confirmedAppointments.forEach(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const [hours, minutes] = apt.appointmentTime.split(':').map(Number);
        aptDate.setHours(hours, minutes, 0, 0);
        
        const endTime = new Date(aptDate.getTime() + 15 * 60 * 1000);
        const isEligible = endTime <= fifteenMinutesAgo;
        
        if (isEligible) {
          eligibleCount++;
          const minutesAgo = Math.floor((now.getTime() - endTime.getTime()) / (1000 * 60));
          console.log(`   ✅ Rendez-vous ${apt.id.substring(0, 8)}...`);
          console.log(`      Terminé il y a ${minutesAgo} minutes`);
          console.log(`      → Recevra l'email au prochain cycle\n`);
        }
      });

      if (eligibleCount === 0) {
        console.log('   ℹ️  Aucun rendez-vous éligible pour le moment');
        console.log('   Les rendez-vous doivent être terminés depuis au moins 15 minutes\n');
      } else {
        console.log(`   🎯 ${eligibleCount} rendez-vous recevront l'email de feedback\n`);
      }
    } else {
      console.log('   ℹ️  Aucun rendez-vous confirmé en attente d\'email\n');
    }

    // Vérifier les services
    console.log('='.repeat(60));
    console.log('⚙️  Services Automatiques\n');

    console.log('Les services suivants doivent être actifs dans le backend:');
    console.log('   1. AppointmentReminderService');
    console.log('      - Rappel 30 min avant l\'entretien');
    console.log('      - Vérifie toutes les 5 minutes\n');
    
    console.log('   2. AppointmentFeedbackService');
    console.log('      - Email de feedback 15 min après l\'entretien');
    console.log('      - Email de préparation 24h avant');
    console.log('      - Vérifie toutes les 5 minutes (feedback)');
    console.log('      - Vérifie toutes les heures (préparation)\n');

    console.log('Pour vérifier que les services sont actifs:');
    console.log('   1. Démarrez le backend: npm run dev');
    console.log('   2. Vérifiez les logs au démarrage:');
    console.log('      ✅ Appointment reminder service started');
    console.log('      ✅ Appointment feedback service started\n');

    // Recommandations
    console.log('='.repeat(60));
    console.log('💡 Recommandations\n');

    if (stats.total === 0) {
      console.log('   📝 Créez un rendez-vous de test:');
      console.log('      1. Connectez-vous en tant que candidat');
      console.log('      2. Allez sur Matching Profile');
      console.log('      3. Créez un rendez-vous avec une entreprise\n');
    } else if (stats.confirmed === 0 && stats.pending > 0) {
      console.log('   ✅ Confirmez les rendez-vous en attente:');
      console.log('      1. Connectez-vous en tant qu\'admin/entreprise');
      console.log('      2. Allez sur la page Appointments');
      console.log('      3. Confirmez les rendez-vous\n');
    } else if (stats.confirmed > 0) {
      console.log('   ⏰ Pour tester rapidement:');
      console.log('      1. Créez un rendez-vous avec une date/heure passée');
      console.log('      2. Confirmez-le');
      console.log('      3. Attendez 5 minutes pour l\'email automatique\n');
      
      console.log('   📧 Pour voir les emails en développement:');
      console.log('      1. Installez MailDev: npm install -g maildev');
      console.log('      2. Lancez-le: maildev');
      console.log('      3. Ouvrez: http://localhost:1080\n');
    }

    console.log('='.repeat(60));
    console.log('✅ Vérification terminée\n');

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

checkServices();
