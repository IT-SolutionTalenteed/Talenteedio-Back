import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { CompanyAppointment } from './src/database/entities/CompanyAppointment';
import { User } from './src/database/entities/User';

async function checkUserAppointments() {
  try {
    console.log('Connexion à la base de données...');
    const connection = await createConnection();

    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.error('❌ Veuillez fournir l\'email de l\'utilisateur');
      console.log('Usage: npm run ts-node check-user-appointments.ts <user-email>');
      process.exit(1);
    }

    console.log(`\nRecherche de l'utilisateur ${userEmail}...`);
    
    const user = await User.findOne({
      where: { email: userEmail },
    });

    if (!user) {
      console.error(`❌ Utilisateur ${userEmail} introuvable`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.firstName} ${user.lastName} (${user.email})`);

    console.log(`\n📋 Recherche de tous les rendez-vous...`);
    
    const appointments = await CompanyAppointment.find({
      where: { userId: user.id },
      relations: ['company', 'matchingProfile'],
      order: { appointmentDate: 'DESC' },
    });

    if (appointments.length === 0) {
      console.log('❌ Aucun rendez-vous trouvé');
      await connection.close();
      return;
    }

    console.log(`\n✅ ${appointments.length} rendez-vous trouvé(s):\n`);

    appointments.forEach((apt, index) => {
      console.log(`─────────────────────────────────────────────────────────────`);
      console.log(`Rendez-vous #${index + 1}`);
      console.log(`─────────────────────────────────────────────────────────────`);
      console.log(`ID: ${apt.id}`);
      console.log(`Entreprise: ${apt.company?.company_name || 'N/A'} (ID: ${apt.companyId})`);
      console.log(`Date: ${apt.appointmentDate}`);
      console.log(`Heure: ${apt.appointmentTime}`);
      console.log(`Statut: ${apt.status}`);
      console.log(`Message: ${apt.message || 'N/A'}`);
      console.log(`Feedback soumis: ${apt.feedbackSubmitted ? 'Oui' : 'Non'}`);
      if (apt.feedbackSubmitted) {
        console.log(`  - Décision: ${apt.candidateDecision}`);
        console.log(`  - Note: ${apt.candidateRating || 'N/A'}`);
      }
      console.log(`Créé le: ${apt.createdAt}`);
      console.log(`Mis à jour le: ${apt.updatedAt}`);
    });

    console.log(`\n─────────────────────────────────────────────────────────────`);
    console.log(`\n📊 Résumé par statut:`);
    
    const statusCounts: { [key: string]: number } = {};
    appointments.forEach(apt => {
      statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log(`\n📊 Rendez-vous actifs (pending ou confirmed):`);
    const activeAppointments = appointments.filter(apt => 
      apt.status === 'pending' || apt.status === 'confirmed'
    );
    
    if (activeAppointments.length === 0) {
      console.log('   Aucun rendez-vous actif');
    } else {
      activeAppointments.forEach(apt => {
        console.log(`   - ${apt.company?.company_name} (${apt.status}) - ${apt.appointmentDate}`);
      });
    }

    await connection.close();
    console.log('\n✅ Terminé!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkUserAppointments();
