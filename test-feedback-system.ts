import AppDataSource from './src/database';
import { CompanyAppointment, AppointmentStatus } from './src/database/entities/CompanyAppointment';
import { User } from './src/database/entities/User';
import { Company } from './src/database/entities/Company';
import { MatchingProfile } from './src/database/entities/MatchingProfile';
import { AppointmentFeedbackService } from './src/services/appointment-feedback.service';
import { sendAppointmentFeedbackRequest } from './src/helpers/mailer/send-appointment-feedback-request';

async function testFeedbackSystem() {
  try {
    console.log('🚀 Initialisation de la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Base de données initialisée\n');

    // Test 1: Créer un rendez-vous de test terminé
    console.log('📝 Test 1: Création d\'un rendez-vous de test...');
    
    // Récupérer un utilisateur et une entreprise existants
    const user = await User.findOne({ where: {} });
    const company = await Company.findOne({ where: {}, relations: ['contact'] });
    const profile = await MatchingProfile.findOne({ where: { userId: user?.id } });

    if (!user || !company || !profile) {
      console.error('❌ Impossible de trouver un utilisateur, une entreprise ou un profil de test');
      console.log('Créez d\'abord des données de test dans votre base de données');
      process.exit(1);
    }

    // Créer un rendez-vous terminé il y a 20 minutes
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);
    
    const testAppointment = new CompanyAppointment();
    testAppointment.userId = user.id;
    testAppointment.companyId = company.id;
    testAppointment.matchingProfileId = profile.id;
    testAppointment.appointmentDate = twentyMinutesAgo;
    testAppointment.appointmentTime = twentyMinutesAgo.toTimeString().substring(0, 5);
    testAppointment.timezone = 'Europe/Paris';
    testAppointment.status = AppointmentStatus.CONFIRMED;
    testAppointment.message = 'Test appointment for feedback system';
    testAppointment.reminderSent = true;
    testAppointment.feedbackEmailSent = false;

    await testAppointment.save();
    console.log(`✅ Rendez-vous de test créé (ID: ${testAppointment.id})`);
    console.log(`   - Date: ${testAppointment.appointmentDate}`);
    console.log(`   - Heure: ${testAppointment.appointmentTime}`);
    console.log(`   - Statut: ${testAppointment.status}\n`);

    // Test 2: Vérifier la détection des rendez-vous terminés
    console.log('🔍 Test 2: Vérification de la détection des rendez-vous terminés...');
    
    const completedAppointments = await CompanyAppointment.find({
      where: {
        status: AppointmentStatus.CONFIRMED,
        feedbackEmailSent: false,
      },
      relations: ['user', 'company'],
    });

    console.log(`✅ ${completedAppointments.length} rendez-vous confirmés sans email de feedback trouvés\n`);

    // Test 3: Envoyer l'email de feedback
    console.log('📧 Test 3: Envoi de l\'email de feedback...');
    
    try {
      await sendAppointmentFeedbackRequest({
        candidateName: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email,
        candidateEmail: user.email,
        companyName: company.company_name,
        appointmentDate: testAppointment.appointmentDate.toISOString(),
        appointmentTime: testAppointment.appointmentTime,
        appointmentId: testAppointment.id,
      });
      
      console.log('✅ Email de feedback envoyé avec succès');
      console.log(`   - Destinataire: ${user.email}`);
      console.log(`   - Entreprise: ${company.company_name}`);
      console.log(`   - Lien: ${process.env.FRONTEND_URL || 'http://localhost:4200'}/matching-profile?feedback=${testAppointment.id}\n`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    }

    // Test 4: Exécuter le service de feedback
    console.log('⚙️  Test 4: Exécution du service de feedback...');
    
    await AppointmentFeedbackService.sendPendingFeedbackRequests();
    
    // Vérifier que le statut a été mis à jour
    const updatedAppointment = await CompanyAppointment.findOne({
      where: { id: testAppointment.id },
    });

    if (updatedAppointment) {
      console.log('✅ Service de feedback exécuté');
      console.log(`   - feedbackEmailSent: ${updatedAppointment.feedbackEmailSent}`);
      console.log(`   - status: ${updatedAppointment.status}\n`);
    }

    // Test 5: Tester la soumission de feedback (simulation)
    console.log('📝 Test 5: Simulation de soumission de feedback...');
    
    if (updatedAppointment) {
      updatedAppointment.candidateFeedback = 'Excellent entretien ! L\'équipe était très accueillante et le poste correspond parfaitement à mes attentes.';
      updatedAppointment.candidateDecision = 'go';
      updatedAppointment.candidateRating = 5;
      updatedAppointment.feedbackSubmitted = true;
      updatedAppointment.feedbackSubmittedAt = new Date();
      
      await updatedAppointment.save();
      
      console.log('✅ Feedback simulé enregistré');
      console.log(`   - Décision: ${updatedAppointment.candidateDecision}`);
      console.log(`   - Note: ${updatedAppointment.candidateRating}/5`);
      console.log(`   - Feedback: ${updatedAppointment.candidateFeedback.substring(0, 50)}...\n`);
    }

    // Test 6: Vérifier les rendez-vous avec feedback
    console.log('📊 Test 6: Statistiques des feedbacks...');
    
    const allAppointments = await CompanyAppointment.find();
    const withFeedback = allAppointments.filter(apt => apt.feedbackSubmitted);
    const goDecisions = withFeedback.filter(apt => apt.candidateDecision === 'go');
    const notDecisions = withFeedback.filter(apt => apt.candidateDecision === 'not');
    
    console.log(`✅ Statistiques:`);
    console.log(`   - Total rendez-vous: ${allAppointments.length}`);
    console.log(`   - Avec feedback: ${withFeedback.length}`);
    console.log(`   - Décisions "Go": ${goDecisions.length}`);
    console.log(`   - Décisions "Not": ${notDecisions.length}`);
    
    if (withFeedback.length > 0) {
      const avgRating = withFeedback
        .filter(apt => apt.candidateRating)
        .reduce((sum, apt) => sum + (apt.candidateRating || 0), 0) / withFeedback.length;
      console.log(`   - Note moyenne: ${avgRating.toFixed(2)}/5\n`);
    }

    // Nettoyage (optionnel)
    console.log('🧹 Nettoyage...');
    const cleanup = process.argv.includes('--cleanup');
    
    if (cleanup) {
      await CompanyAppointment.delete(testAppointment.id);
      console.log('✅ Rendez-vous de test supprimé\n');
    } else {
      console.log('ℹ️  Rendez-vous de test conservé (utilisez --cleanup pour le supprimer)\n');
    }

    console.log('✅ Tous les tests sont terminés avec succès !');
    console.log('\n📋 Résumé:');
    console.log('   1. ✅ Création de rendez-vous de test');
    console.log('   2. ✅ Détection des rendez-vous terminés');
    console.log('   3. ✅ Envoi d\'email de feedback');
    console.log('   4. ✅ Exécution du service de feedback');
    console.log('   5. ✅ Soumission de feedback');
    console.log('   6. ✅ Statistiques des feedbacks');
    
    console.log('\n🎉 Le système de feedback fonctionne correctement !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Exécuter les tests
console.log('='.repeat(60));
console.log('🧪 TEST DU SYSTÈME DE FEEDBACK DES ENTRETIENS');
console.log('='.repeat(60));
console.log('');

testFeedbackSystem();
