import transporter from './index';

interface CoachingConfirmationData {
  name: string;
  email: string;
  consultant: string;
  serviceName: string;
  date: string;
  time: string;
  frequency?: string;
  amount: number;
}

export const sendCoachingConfirmation = async (data: CoachingConfirmationData) => {
  try {
    const mailOptions = {
      from: process.env.MAILUSER,
      to: data.email,
      subject: `Confirmation de votre réservation - ${data.serviceName}`,
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
        frequency: data.frequency === 'weekly' ? 'Hebdomadaire' : data.frequency === 'biweekly' ? 'Toutes les 2 semaines' : null,
        amount: (data.amount / 100).toFixed(2),
        year: new Date().getFullYear(),
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Coaching confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending coaching confirmation email:', error);
    throw error;
  }
};
