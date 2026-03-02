import AppDataSource from './src/database';
import { CompanyAppointment, AppointmentStatus } from './src/database/entities/CompanyAppointment';
import { AppointmentFeedbackService } from './src/services/appointment-feedback.service';

async function testFeedbackSystemSimple() {
  try {
    console.log('🚀 Initialisation de la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Base de données initialisée\n');

    // Test 1: Vérifier les rendez-vous existants
    console.log('📊 Test 1: Vérification des rendez-vous existants...');
    
    const allAppointments = await CompanyAppointment.find({
      relations: ['user', 'company'],
    });

    console.log(`✅ ${allAppointments.length} rendez-vous trouvés dans la base de données\n`);

    if (allAppointments.length === 0) {
      console.log('ℹ️  Aucun rendez-vous trouvé. Créez d\'abord un rendez-vous via l\'interface.');
      console.log('   1. Connectez-vous en tant que candidat');
      console.log('   2. Allez sur la page Matching Profile');
      console.log('   3. Créez un rendez-vous avec une entreprise\n');
      await AppDataSource.destroy();
      process.exit(0);
    }

    // Test 2: Afficher les rendez-vous par statut
    console.log('📋 Test 2: Rendez-vous par statut...');
    
    const byStatus = allAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    console.log('');

    // Test 3: Vérifier les rendez-vous confirmés
    console.log('🔍 Test 3: Rendez-vous confirmés...');
    
    const confirmedAppointments = allAppointments.filter(
      apt => apt.status === AppointmentStatus.CONFIRMED
    );

    console.log(`✅ ${confirmedAppointments.length} rendez-vous confirmés\n`);

    if (confirmedAppointments.length > 0) {
      console.log('📅 Détails des rendez-vous confirmés:');
      confirmedAppointments.forEach((apt, index) => {
        const aptDate = new Date(apt.appointmentDate);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - aptDate.getTime()) / (1000 * 60));
        
        console.log(`\n   ${index + 1}. Rendez-vous ID: ${apt.id}`);
        console.log(`      - Entreprise: ${apt.company?.company_name || 'N/A'}`);
        console.log(`      - Candidat: ${apt.user?.email || 'N/A'}`);
        console.log(`      - Date: ${aptDate.toLocaleDateString('fr-FR')}`);
        console.log(`      - Heure: ${apt.appointmentTime}`);
        console.log(`      - Il y a: ${diffMinutes} minutes`);
        console.log(`      - Feedback email envoyé: ${apt.feedbackEmailSent ? '✅' : '❌'}`);
        console.log(`      - Feedback soumis: ${apt.feedbackSubmitted ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // Test 4: Vérifier les rendez-vous éligibles pour le feedback
    console.log('🎯 Test 4: Rendez-vous éligibles pour le feedback...');
    
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const eligibleAppointments = confirmedAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const [hours, minutes] = apt.appointmentTime.split(':').map(Number);
      aptDate.setHours(hours, minutes, 0, 0);
      
      // Ajouter 15 minutes (durée de l'entretien)
      const endTime = new Date(aptDate.getTime() + 15 * 60 * 1000);
      
      return endTime <= fifteenMinutesAgo && !apt.feedbackEmailSent;
    });

    console.log(`✅ ${eligibleAppointments.length} rendez-vous éligibles pour recevoir l'email de feedback\n`);

    if (eligibleAppointments.length > 0) {
      console.log('📧 Ces rendez-vous recevront l\'email de feedback au prochain cycle (5 min):');
      eligibleAppointments.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.company?.company_name || 'N/A'} - ${apt.user?.email || 'N/A'}`);
      });
      console.log('');
    }

    // Test 5: Statistiques des feedbacks
    console.log('📊 Test 5: Statistiques des feedbacks...');
    
    const completedAppointments = allAppointments.filter(
      apt => apt.status === AppointmentStatus.COMPLETED
    );
    
    const withFeedback = allAppointments.filter(apt => apt.feedbackSubmitted);
    const goDecisions = withFeedback.filter(apt => apt.candidateDecision === 'go');
    const notDecisions = withFeedback.filter(apt => apt.candidateDecision === 'not');
    
    console.log(`   - Total rendez-vous: ${allAppointments.length}`);
    console.log(`   - Rendez-vous terminés: ${completedAppointments.length}`);
    console.log(`   - Avec feedback: ${withFeedback.length}`);
    
    if (withFeedback.length > 0) {
      console.log(`   - Décisions "Go": ${goDecisions.length} (${Math.round(goDecisions.length * 100 / withFeedback.length)}%)`);
      console.log(`   - Décisions "Not": ${notDecisions.length} (${Math.round(notDecisions.length * 100 / withFeedback.length)}%)`);
      
      const withRating = withFeedback.filter(apt => apt.candidateRating);
      if (withRating.length > 0) {
        const avgRating = withRating.reduce((sum, apt) => sum + (apt.candidateRating || 0), 0) / withRating.length;
        console.log(`   - Note moyenne: ${avgRating.toFixed(2)}/5 (${withRating.length} notes)`);
      }
    }
    console.log('');

    // Test 6: Tester le service de feedback (simulation)
    console.log('⚙️  Test 6: Test du service de feedback (simulation)...');
    console.log('   Note: Ce test ne fait que simuler, il n\'envoie pas d\'emails réels\n');
    
    if (eligibleAppointments.length > 0) {
      console.log('   ✅ Le service détecterait ces rendez-vous et enverrait les emails');
      console.log('   ℹ️  Pour tester réellement, attendez le prochain cycle automatique (5 min)');
      console.log('   ℹ️  Ou redémarrez le backend pour déclencher immédiatement\n');
    } else {
      console.log('   ℹ️  Aucun rendez-vous éligible pour le moment');
      console.log('   ℹ️  Pour tester, créez un rendez-vous avec une date/heure passée\n');
    }

    // Test 7: Afficher les feedbacks existants
    if (withFeedback.length > 0) {
      console.log('💬 Test 7: Feedbacks existants...\n');
      
      withFeedback.slice(0, 3).forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.company?.company_name || 'N/A'}`);
        console.log(`      Décision: ${apt.candidateDecision === 'go' ? '✅ Go' : '❌ Not'}`);
        if (apt.candidateRating) {
          console.log(`      Note: ${'⭐'.repeat(apt.candidateRating)} (${apt.candidateRating}/5)`);
        }
        if (apt.candidateFeedback) {
          const preview = apt.candidateFeedback.substring(0, 80);
          console.log(`      Feedback: "${preview}${apt.candidateFeedback.length > 80 ? '...' : ''}"`);
        }
        console.log('');
      });
      
      if (withFeedback.length > 3) {
        console.log(`   ... et ${withFeedback.length - 3} autres feedbacks\n`);
      }
    }

    // Résumé final
    console.log('='.repeat(60));
    console.log('✅ Tests terminés avec succès !');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Résumé:');
    console.log(`   - ${allAppointments.length} rendez-vous au total`);
    console.log(`   - ${confirmedAppointments.length} confirmés`);
    console.log(`   - ${eligibleAppointments.length} éligibles pour feedback`);
    console.log(`   - ${withFeedback.length} feedbacks soumis`);
    console.log('');
    
    if (eligibleAppointments.length > 0) {
      console.log('🎯 Prochaine étape:');
      console.log('   Les emails de feedback seront envoyés automatiquement');
      console.log('   au prochain cycle (dans moins de 5 minutes)');
    } else if (confirmedAppointments.length > 0) {
      console.log('ℹ️  Pour tester le système de feedback:');
      console.log('   1. Créez un rendez-vous avec une date/heure passée');
      console.log('   2. Confirmez-le');
      console.log('   3. Attendez 5 minutes pour l\'envoi automatique de l\'email');
    } else {
      console.log('ℹ️  Pour commencer:');
      console.log('   1. Créez un rendez-vous via l\'interface candidat');
      console.log('   2. Confirmez-le via l\'interface admin/entreprise');
      console.log('   3. Le système gérera automatiquement les emails');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Exécuter les tests
console.log('='.repeat(60));
console.log('🧪 TEST SIMPLE DU SYSTÈME DE FEEDBACK');
console.log('='.repeat(60));
console.log('');

testFeedbackSystemSimple();
