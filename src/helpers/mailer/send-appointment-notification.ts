import transporter from './index';

interface AppointmentNotificationData {
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  companyEmail: string;
  adminEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
  message?: string;
  appointmentId: string;
}

export async function sendAppointmentNotification(data: AppointmentNotificationData): Promise<void> {
  const {
    candidateName,
    candidateEmail,
    companyName,
    companyEmail,
    adminEmail,
    appointmentDate,
    appointmentTime,
    timezone,
    message,
    appointmentId,
  } = data;

  const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validationUrl = `${process.env.ADMIN_HOST_URL || 'http://localhost:5173'}/dashboard/appointments`;

  // Email pour l'admin
  const adminSubject = `Nouveau rendez-vous à valider - ${candidateName} avec ${companyName}`;
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Nouveau rendez-vous à valider</h2>
      <p>Un nouveau rendez-vous a été demandé et nécessite votre validation.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Détails du rendez-vous</h3>
        <p><strong>Candidat:</strong> ${candidateName} (${candidateEmail})</p>
        <p><strong>Entreprise:</strong> ${companyName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Heure:</strong> ${appointmentTime} (${timezone})</p>
        ${message ? `<p><strong>Message du candidat:</strong><br/>${message}</p>` : ''}
      </div>
      
      <p>
        <a href="${validationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Gérer les rendez-vous
        </a>
      </p>
    </div>
  `;

  // Email pour l'entreprise
  const companySubject = `Nouvelle demande d'entretien - ${candidateName}`;
  const companyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Nouvelle demande d'entretien</h2>
      <p>Bonjour,</p>
      <p>Un candidat souhaite prendre rendez-vous avec votre entreprise.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Détails du rendez-vous</h3>
        <p><strong>Candidat:</strong> ${candidateName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Heure:</strong> ${appointmentTime} (${timezone})</p>
        ${message ? `<p><strong>Message du candidat:</strong><br/>${message}</p>` : ''}
      </div>
      
      <p>
        <a href="${validationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Répondre à la demande
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">Connectez-vous à votre espace pour accepter ou refuser cette demande d'entretien.</p>
    </div>
  `;

  // Email pour le candidat
  const candidateSubject = `Demande d'entretien envoyée - ${companyName}`;
  const candidateHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Demande d'entretien envoyée</h2>
      <p>Bonjour ${candidateName},</p>
      <p>Votre demande d'entretien a bien été envoyée à ${companyName}.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Détails du rendez-vous</h3>
        <p><strong>Entreprise:</strong> ${companyName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Heure:</strong> ${appointmentTime} (${timezone})</p>
        ${message ? `<p><strong>Votre message:</strong><br/>${message}</p>` : ''}
      </div>
      
      <p>Votre demande est en attente de validation. Vous recevrez une confirmation par email dès qu'elle sera validée.</p>
    </div>
  `;

  // Envoyer les emails
  await Promise.all([
    transporter.sendMail({
      from: process.env.MAILUSER,
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
    }),
    transporter.sendMail({
      from: process.env.MAILUSER,
      to: companyEmail,
      subject: companySubject,
      html: companyHtml,
    }),
    transporter.sendMail({
      from: process.env.MAILUSER,
      to: candidateEmail,
      subject: candidateSubject,
      html: candidateHtml,
    }),
  ]);
}

interface AppointmentStatusUpdateData {
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  companyEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
  status: 'confirmed' | 'rejected';
  companyNotes?: string;
}

export async function sendAppointmentStatusUpdate(data: AppointmentStatusUpdateData): Promise<void> {
  const {
    candidateName,
    candidateEmail,
    companyName,
    companyEmail,
    appointmentDate,
    appointmentTime,
    timezone,
    status,
    companyNotes,
  } = data;

  const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (status === 'confirmed') {
    // Email pour le candidat - Confirmation
    const candidateSubject = `Entretien confirmé avec ${companyName}`;
    const candidateHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Entretien confirmé ✓</h2>
        <p>Bonjour ${candidateName},</p>
        <p>Bonne nouvelle ! Votre entretien avec ${companyName} a été confirmé.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">Détails de l'entretien</h3>
          <p><strong>Entreprise:</strong> ${companyName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Heure:</strong> ${appointmentTime} (${timezone})</p>
          ${companyNotes ? `<p><strong>Notes de l'entreprise:</strong><br/>${companyNotes}</p>` : ''}
        </div>
        
        <p>Nous vous souhaitons bonne chance pour votre entretien !</p>
      </div>
    `;

    // Email pour l'entreprise - Confirmation
    const companySubject = `Entretien confirmé avec ${candidateName}`;
    const companyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Entretien confirmé</h2>
        <p>Bonjour,</p>
        <p>L'entretien avec ${candidateName} a été confirmé.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">Détails de l'entretien</h3>
          <p><strong>Candidat:</strong> ${candidateName} (${candidateEmail})</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Heure:</strong> ${appointmentTime} (${timezone})</p>
        </div>
      </div>
    `;

    await Promise.all([
      transporter.sendMail({
        from: process.env.MAILUSER,
        to: candidateEmail,
        subject: candidateSubject,
        html: candidateHtml,
      }),
      transporter.sendMail({
        from: process.env.MAILUSER,
        to: companyEmail,
        subject: companySubject,
        html: companyHtml,
      }),
    ]);
  } else {
    // Email pour le candidat - Rejet
    const candidateSubject = `Entretien non confirmé - ${companyName}`;
    const candidateHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Entretien non confirmé</h2>
        <p>Bonjour ${candidateName},</p>
        <p>Malheureusement, votre demande d'entretien avec ${companyName} n'a pas pu être confirmée.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">Détails</h3>
          <p><strong>Entreprise:</strong> ${companyName}</p>
          <p><strong>Date demandée:</strong> ${formattedDate}</p>
          <p><strong>Heure demandée:</strong> ${appointmentTime} (${timezone})</p>
          ${companyNotes ? `<p><strong>Raison:</strong><br/>${companyNotes}</p>` : ''}
        </div>
        
        <p>N'hésitez pas à proposer d'autres créneaux ou à postuler à d'autres offres.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.MAILUSER,
      to: candidateEmail,
      subject: candidateSubject,
      html: candidateHtml,
    });
  }
}
