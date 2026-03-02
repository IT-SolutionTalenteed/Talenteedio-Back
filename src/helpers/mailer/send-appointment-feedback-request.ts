import transporter from './index';

interface AppointmentFeedbackRequestData {
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentId: string;
}

export async function sendAppointmentFeedbackRequest(data: AppointmentFeedbackRequestData): Promise<void> {
  const {
    candidateName,
    candidateEmail,
    companyName,
    appointmentDate,
    appointmentTime,
    appointmentId,
  } = data;

  const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const feedbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/matching-profile/feedback/${appointmentId}`;

  const subject = `Comment s'est passé votre entretien avec ${companyName} ?`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Comment s'est passé votre entretien ?</h2>
      <p>Bonjour ${candidateName},</p>
      <p>Votre entretien avec <strong>${companyName}</strong> vient de se terminer.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Détails de l'entretien</h3>
        <p><strong>Entreprise:</strong> ${companyName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Heure:</strong> ${appointmentTime}</p>
      </div>
      
      <p>Nous aimerions connaître votre ressenti sur cet entretien. Votre feedback nous aide à améliorer votre expérience.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${feedbackUrl}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Donner mon feedback
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Cela ne prendra que quelques minutes et nous permettra de mieux vous accompagner dans votre recherche d'emploi.
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
        ${feedbackUrl}
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAILUSER,
    to: candidateEmail,
    subject: subject,
    html: html,
  });

  console.log(`Feedback request email sent to ${candidateEmail} for appointment ${appointmentId}`);
}

interface AppointmentPreparationReminderData {
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export async function sendAppointmentPreparationReminder(data: AppointmentPreparationReminderData): Promise<void> {
  const {
    candidateName,
    candidateEmail,
    companyName,
    appointmentDate,
    appointmentTime,
  } = data;

  const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const preparationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/coaching-emploi`;

  const subject = `Préparez votre entretien avec ${companyName} - Demain !`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Votre entretien approche !</h2>
      <p>Bonjour ${candidateName},</p>
      <p>Votre entretien avec <strong>${companyName}</strong> a lieu demain.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="margin-top: 0; color: #856404;">Rappel de l'entretien</h3>
        <p><strong>Entreprise:</strong> ${companyName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Heure:</strong> ${appointmentTime}</p>
      </div>
      
      <h3 style="color: #333;">Préparez-vous efficacement</h3>
      <p>Pour mettre toutes les chances de votre côté, nous vous proposons un accompagnement personnalisé pour préparer votre entretien.</p>
      
      <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
        <h4 style="margin-top: 0; color: #0c5460;">Notre accompagnement comprend :</h4>
        <ul style="color: #0c5460;">
          <li>Conseils personnalisés pour votre entretien</li>
          <li>Questions fréquentes et comment y répondre</li>
          <li>Techniques pour valoriser votre profil</li>
          <li>Gestion du stress et de la confiance</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${preparationUrl}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Préparer mon entretien
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Bonne chance pour votre entretien ! 🍀
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAILUSER,
    to: candidateEmail,
    subject: subject,
    html: html,
  });

  console.log(`Preparation reminder email sent to ${candidateEmail}`);
}
