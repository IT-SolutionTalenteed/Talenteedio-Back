import transporter from './index';

interface AppointmentStatusData {
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  companyEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
  status: 'confirmed' | 'rejected';
  companyNotes?: string;
  rejectionReason?: string;
}

export async function sendAppointmentStatusNotification(data: AppointmentStatusData) {
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
    rejectionReason,
  } = data;

  const platformUrl = process.env.FRONTEND_URL || 'https://talenteed.io';

  if (status === 'confirmed') {
    // Email de confirmation
    const mailOptions = {
      from: `Talenteed.io <${process.env.MAILUSER}>`,
      to: candidateEmail,
      subject: `✅ Entretien confirmé avec ${companyName}`,
      template: 'appointment-confirmed',
      context: {
        candidateName,
        companyName,
        companyEmail,
        appointmentDate,
        appointmentTime,
        timezone,
        companyNotes,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Appointment confirmation email sent to ${candidateEmail}:`, info.messageId);
    return info;
  } else if (status === 'rejected') {
    // Email de rejet
    const mailOptions = {
      from: `Talenteed.io <${process.env.MAILUSER}>`,
      to: candidateEmail,
      subject: `Réponse à votre demande d'entretien avec ${companyName}`,
      template: 'appointment-rejected',
      context: {
        candidateName,
        companyName,
        rejectionReason,
        platformUrl,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Appointment rejection email sent to ${candidateEmail}:`, info.messageId);
    return info;
  }
}

interface AppointmentReminderData {
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  companyEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
}

export async function sendAppointmentReminder(data: AppointmentReminderData) {
  const {
    candidateName,
    candidateEmail,
    companyName,
    companyEmail,
    appointmentDate,
    appointmentTime,
    timezone,
  } = data;

  const mailOptions = {
    from: `Talenteed.io <${process.env.MAILUSER}>`,
    to: candidateEmail,
    subject: `⏰ Rappel : Entretien avec ${companyName} dans 30 minutes`,
    template: 'appointment-reminder',
    context: {
      candidateName,
      companyName,
      companyEmail,
      appointmentDate,
      appointmentTime,
      timezone,
    },
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Appointment reminder email sent to ${candidateEmail}:`, info.messageId);
  return info;
}
