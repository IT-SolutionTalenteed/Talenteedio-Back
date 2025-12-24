import transporter from './index';

interface BookingValidationNotificationData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  date: string;
  time: string;
  timezone: string;
  action: 'confirm' | 'reject';
  consultantMessage?: string;
  amount: number;
  meetingLink?: string; // Lien de réunion du pricing
}

export const sendBookingValidationNotification = async (data: BookingValidationNotificationData) => {
  try {
    const isConfirmed = data.action === 'confirm';
    
    const mailOptions = {
      from: process.env.MAILUSER,
      to: data.clientEmail,
      subject: isConfirmed 
        ? `Réservation confirmée - ${data.serviceName}`
        : `Réservation annulée - ${data.serviceName}`,
      template: isConfirmed ? 'booking-confirmed' : 'booking-rejected',
      context: {
        clientName: data.clientName,
        serviceName: data.serviceName,
        date: new Date(data.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: data.time,
        timezone: data.timezone,
        consultantMessage: data.consultantMessage,
        amount: data.amount.toFixed(2),
        isConfirmed: isConfirmed,
        meetingLink: isConfirmed ? data.meetingLink : undefined, // Inclure le lien seulement si confirmé
        year: new Date().getFullYear(),
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Booking validation notification sent (${data.action}):`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending booking validation notification:', error);
    throw error;
  }
};