import transporter from './index';

interface CoachingConfirmationData {
  name: string;
  email: string;
  consultant: string;
  consultantEmail?: string;
  serviceName: string;
  date: string;
  time: string;
  timezone?: string;
  frequency?: string;
  amount: number;
  bookingId?: string;
}

export const sendCoachingConfirmation = async (data: CoachingConfirmationData) => {
  try {
    // Email au client
    const clientMailOptions = {
      from: data.consultantEmail || process.env.MAILUSER, // Utiliser l'email du consultant si disponible
      to: data.email,
      subject: `Paiement confirmé - ${data.serviceName}`,
      template: 'coaching-confirmation',
      context: {
        name: data.name,
        consultant: data.consultant,
        serviceName: data.serviceName,
        date: new Date(data.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: data.time,
        timezone: data.timezone || 'Europe/Paris',
        frequency: data.frequency === 'weekly' ? 'Hebdomadaire' : data.frequency === 'biweekly' ? 'Toutes les 2 semaines' : null,
        amount: typeof data.amount === 'number' ? data.amount.toFixed(2) : (data.amount / 100).toFixed(2),
        year: new Date().getFullYear(),
      },
    };

    const clientInfo = await transporter.sendMail(clientMailOptions);
    console.log('Client payment confirmation email sent:', clientInfo.messageId);

    // Email au consultant pour validation
    if (data.consultantEmail) {
      const consultantMailOptions = {
        from: data.consultantEmail, // Utiliser l'email du consultant comme expéditeur
        to: data.consultantEmail,
        subject: `Nouvelle réservation à valider - ${data.serviceName}`,
        template: 'consultant-booking-validation',
        context: {
          consultant: data.consultant,
          clientName: data.name,
          clientEmail: data.email,
          serviceName: data.serviceName,
          date: new Date(data.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          time: data.time,
          timezone: data.timezone || 'Europe/Paris',
          frequency: data.frequency === 'weekly' ? 'Hebdomadaire' : data.frequency === 'biweekly' ? 'Toutes les 2 semaines' : null,
          amount: typeof data.amount === 'number' ? data.amount.toFixed(2) : (data.amount / 100).toFixed(2),
          bookingId: data.bookingId,
          confirmUrl: `${process.env.FRONTEND_HOST}/coaching-emploi/validate-booking/${data.bookingId}?action=confirm`,
          rejectUrl: `${process.env.FRONTEND_HOST}/coaching-emploi/validate-booking/${data.bookingId}?action=reject`,
          year: new Date().getFullYear(),
        },
      };

      const consultantInfo = await transporter.sendMail(consultantMailOptions);
      console.log('Consultant validation email sent:', consultantInfo.messageId);
    }

    return { clientInfo, consultantInfo: data.consultantEmail ? 'sent' : 'no email' };
  } catch (error) {
    console.error('Error sending coaching confirmation emails:', error);
    throw error;
  }
};
