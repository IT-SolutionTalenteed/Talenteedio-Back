import { LessThan } from 'typeorm';
import { CompanyAppointment, AppointmentStatus } from '../database/entities/CompanyAppointment';
import { sendAppointmentFeedbackRequest, sendAppointmentPreparationReminder } from '../helpers/mailer/send-appointment-feedback-request';

export class AppointmentFeedbackService {
  /**
   * Envoie les emails de demande de feedback pour les entretiens terminés
   * Cette fonction doit être appelée régulièrement (par exemple, toutes les 5 minutes via un cron job)
   */
  static async sendPendingFeedbackRequests(): Promise<void> {
    try {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      console.log(`[Appointment Feedback] Checking for completed appointments before ${fifteenMinutesAgo.toISOString()}`);

      // Trouver tous les entretiens confirmés qui sont terminés (15 minutes après l'heure prévue)
      // et pour lesquels l'email de feedback n'a pas encore été envoyé
      const appointments = await CompanyAppointment.find({
        where: {
          status: AppointmentStatus.CONFIRMED,
          feedbackEmailSent: false,
        },
        relations: ['user', 'company'],
      });

      console.log(`[Appointment Feedback] Found ${appointments.length} confirmed appointments to check`);

      let feedbackRequestsSent = 0;

      for (const appointment of appointments) {
        try {
          // Construire la date/heure complète de l'entretien
          const appointmentDateTime = this.getAppointmentDateTime(
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.timezone
          );

          // Ajouter 15 minutes (durée de l'entretien) pour obtenir l'heure de fin
          const appointmentEndTime = new Date(appointmentDateTime.getTime() + 15 * 60 * 1000);

          // Vérifier si l'entretien est terminé depuis au moins 15 minutes
          if (appointmentEndTime <= fifteenMinutesAgo) {
            console.log(`[Appointment Feedback] Sending feedback request for appointment ${appointment.id}`);

            // Envoyer la demande de feedback
            await sendAppointmentFeedbackRequest({
              candidateName: `${appointment.user.firstname || ''} ${appointment.user.lastname || ''}`.trim() || appointment.user.email,
              candidateEmail: appointment.user.email,
              companyName: appointment.company.company_name,
              appointmentDate: this.formatDate(appointment.appointmentDate),
              appointmentTime: appointment.appointmentTime,
              appointmentId: appointment.id,
            });

            // Marquer l'email comme envoyé et mettre à jour le statut
            appointment.feedbackEmailSent = true;
            appointment.status = AppointmentStatus.COMPLETED;
            await appointment.save();

            feedbackRequestsSent++;
            console.log(`[Appointment Feedback] Feedback request sent successfully for appointment ${appointment.id}`);
          }
        } catch (error) {
          console.error(`[Appointment Feedback] Error sending feedback request for appointment ${appointment.id}:`, error);
          // Continuer avec les autres rendez-vous même si un échoue
        }
      }

      console.log(`[Appointment Feedback] Sent ${feedbackRequestsSent} feedback requests`);
    } catch (error) {
      console.error('[Appointment Feedback] Error in sendPendingFeedbackRequests:', error);
    }
  }

  /**
   * Envoie les rappels de préparation 24h avant l'entretien
   */
  static async sendPreparationReminders(): Promise<void> {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      console.log(`[Appointment Preparation] Checking for appointments between ${in24Hours.toISOString()} and ${in25Hours.toISOString()}`);

      // Trouver tous les entretiens confirmés qui ont lieu dans 24-25 heures
      const appointments = await CompanyAppointment.find({
        where: {
          status: AppointmentStatus.CONFIRMED,
        },
        relations: ['user', 'company'],
      });

      console.log(`[Appointment Preparation] Found ${appointments.length} confirmed appointments to check`);

      let remindersSent = 0;

      for (const appointment of appointments) {
        try {
          const appointmentDateTime = this.getAppointmentDateTime(
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.timezone
          );

          // Vérifier si l'entretien est dans la fenêtre de 24-25 heures
          if (appointmentDateTime >= in24Hours && appointmentDateTime <= in25Hours) {
            console.log(`[Appointment Preparation] Sending preparation reminder for appointment ${appointment.id}`);

            await sendAppointmentPreparationReminder({
              candidateName: `${appointment.user.firstname || ''} ${appointment.user.lastname || ''}`.trim() || appointment.user.email,
              candidateEmail: appointment.user.email,
              companyName: appointment.company.company_name,
              appointmentDate: this.formatDate(appointment.appointmentDate),
              appointmentTime: appointment.appointmentTime,
            });

            remindersSent++;
            console.log(`[Appointment Preparation] Preparation reminder sent successfully for appointment ${appointment.id}`);
          }
        } catch (error) {
          console.error(`[Appointment Preparation] Error sending preparation reminder for appointment ${appointment.id}:`, error);
        }
      }

      console.log(`[Appointment Preparation] Sent ${remindersSent} preparation reminders`);
    } catch (error) {
      console.error('[Appointment Preparation] Error in sendPreparationReminders:', error);
    }
  }

  /**
   * Construit un objet Date à partir de la date, heure et timezone de l'entretien
   */
  private static getAppointmentDateTime(date: Date | string, time: string, timezone: string): Date {
    let dateStr: string;
    if (date instanceof Date) {
      dateStr = date.toISOString().split('T')[0];
    } else {
      dateStr = String(date).split('T')[0];
    }
    
    const dateTimeStr = `${dateStr}T${time}:00`;
    return new Date(dateTimeStr);
  }

  /**
   * Formate une date pour l'affichage
   */
  private static formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Démarre le service de feedback automatique
   */
  static startFeedbackService(): void {
    console.log('[Appointment Feedback] Starting feedback service...');
    
    // Exécuter immédiatement
    this.sendPendingFeedbackRequests();
    this.sendPreparationReminders();
    
    // Puis toutes les 5 minutes pour les feedbacks
    setInterval(() => {
      this.sendPendingFeedbackRequests();
    }, 5 * 60 * 1000);
    
    // Et toutes les heures pour les rappels de préparation
    setInterval(() => {
      this.sendPreparationReminders();
    }, 60 * 60 * 1000);
    
    console.log('[Appointment Feedback] Feedback service started');
  }
}
