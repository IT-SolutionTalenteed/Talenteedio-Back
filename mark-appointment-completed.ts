import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { CompanyAppointment, AppointmentStatus } from './src/database/entities/CompanyAppointment';

async function markAppointmentCompleted() {
  try {
    console.log('Connexion à la base de données...');
    const connection = await createConnection();

    const appointmentId = process.argv[2];
    
    if (!appointmentId) {
      console.error('❌ Veuillez fournir l\'ID de l\'entretien');
      console.log('Usage: npm run ts-node mark-appointment-completed.ts <appointment-id>');
      process.exit(1);
    }

    console.log(`\nRecherche de l'entretien ${appointmentId}...`);
    
    const appointment = await CompanyAppointment.findOne({
      where: { id: appointmentId },
      relations: ['company', 'user', 'matchingProfile'],
    });

    if (!appointment) {
      console.error(`❌ Entretien ${appointmentId} introuvable`);
      process.exit(1);
    }

    console.log('\n📋 Informations de l\'entretien:');
    console.log(`   ID: ${appointment.id}`);
    console.log(`   Entreprise: ${appointment.company?.company_name || 'N/A'}`);
    console.log(`   Utilisateur: ${appointment.user?.email || 'N/A'}`);
    console.log(`   Date: ${appointment.appointmentDate}`);
    console.log(`   Statut actuel: ${appointment.status}`);
    console.log(`   Feedback déjà soumis: ${appointment.feedbackSubmitted ? 'Oui' : 'Non'}`);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      console.log('\n✅ L\'entretien est déjà marqué comme terminé');
    } else {
      console.log(`\n🔄 Changement du statut de "${appointment.status}" vers "completed"...`);
      
      appointment.status = AppointmentStatus.COMPLETED;
      await appointment.save();
      
      console.log('✅ Statut mis à jour avec succès!');
    }

    if (appointment.feedbackSubmitted) {
      console.log('\n📝 Feedback existant:');
      console.log(`   Décision: ${appointment.candidateDecision}`);
      console.log(`   Note: ${appointment.candidateRating || 'N/A'}`);
      console.log(`   Commentaire: ${appointment.candidateFeedback}`);
      console.log(`   Soumis le: ${appointment.feedbackSubmittedAt}`);
    } else {
      console.log('\n💡 L\'utilisateur peut maintenant soumettre son feedback');
    }

    await connection.close();
    console.log('\n✅ Terminé!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

markAppointmentCompleted();
