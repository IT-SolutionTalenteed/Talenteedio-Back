/**
 * Script de test pour les emails d'entretien
 * 
 * Usage:
 * ts-node test-appointment-emails.ts [confirmed|rejected|reminder]
 */

import dotenv from 'dotenv';
dotenv.config();

import { sendAppointmentStatusNotification, sendAppointmentReminder } from './src/helpers/mailer/send-appointment-status-notification';

const testType = process.argv[2] || 'confirmed';

const testData = {
  candidateName: 'Jean Dupont',
  candidateEmail: process.env.TEST_EMAIL || 'test@example.com',
  companyName: 'TechCorp Solutions',
  companyEmail: 'contact@techcorp.com',
  appointmentDate: 'lundi 17 février 2026',
  appointmentTime: '14:30',
  timezone: 'Europe/Paris',
};

async function testEmails() {
  console.log(`\n🧪 Test des emails d'entretien - Type: ${testType}\n`);
  console.log(`📧 Email de test: ${testData.candidateEmail}\n`);

  try {
    switch (testType) {
      case 'confirmed':
        console.log('✅ Test de l\'email de confirmation...');
        await sendAppointmentStatusNotification({
          ...testData,
          status: 'confirmed',
          companyNotes: 'Merci de préparer votre portfolio et vos questions. L\'entretien se fera en visioconférence via le lien qui vous sera envoyé séparément.',
        });
        console.log('✅ Email de confirmation envoyé avec succès !');
        break;

      case 'rejected':
        console.log('❌ Test de l\'email de rejet...');
        await sendAppointmentStatusNotification({
          ...testData,
          status: 'rejected',
          rejectionReason: 'Nous avons reçu un grand nombre de candidatures et avons dû faire des choix difficiles. Votre profil est intéressant mais ne correspond pas exactement aux besoins actuels du poste. Nous vous encourageons à postuler à nos futures offres.',
        });
        console.log('✅ Email de rejet envoyé avec succès !');
        break;

      case 'reminder':
        console.log('⏰ Test de l\'email de rappel...');
        await sendAppointmentReminder(testData);
        console.log('✅ Email de rappel envoyé avec succès !');
        break;

      default:
        console.error('❌ Type invalide. Utilisez: confirmed, rejected, ou reminder');
        process.exit(1);
    }

    console.log('\n✨ Test terminé avec succès !\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

testEmails();
