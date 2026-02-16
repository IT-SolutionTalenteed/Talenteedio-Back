import { LessThan, MoreThan } from 'typeorm';
import { CompanyAppointment, AppointmentStatus } from '../database/entities/CompanyAppointment';
import { sendAppointmentReminder } from '../helpers/mailer/send-appointment-status-notification';

export class AppointmentReminderService {
  /**
   * Vérifie et envoie les rappels pour les entretiens qui commencent dans 30 minutes
   * Cette fonction doit être appelée régulièrement (par exemple, toutes les 5 minutes via un cron job)
   */
  static async sendPendingReminders(): Promise<void> {
    try {
      const now = new Date();
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
      const in35Minutes = new Date(now.getTime() + 35 * 60 * 1000);

      console.log(`[Appointment Reminder] Checking for appointments between ${in30Minutes.toISOString()} and ${in35Minutes.toISOString()}`);

      // Trouver tous les entretiens confirmés qui commencent dans 30-35 minutes
      // et pour lesquels le rappel n'a pas encore été envoyé
      const appointments = await CompanyAppointment.find({
        where: {
          status: AppointmentStatus.CONFIRMED,
          reminderSent: false,
        },
        relations: ['user', 'company', 'company.contact'],
      });

      console.log(`[Appointment Reminder] Found ${appointments.length} confirmed appointments to check`);

      let remindersSent = 0;

      for (const appointment of appointments) {
        try {
          // Construire la date/heure complète de l'entretien
          const appointmentDateTime = this.getAppointmentDateTime(
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.timezone
          );

          // Vérifier si l'entretien est dans la fenêtre de 30-35 minutes
          if (appointmentDateTime >= in30Minutes && appointmentDateTime <= in35Minutes) {
            console.log(`[Appointment Reminder] Sending reminder for appointment ${appointment.id}`);

            // Envoyer le rappel
            await sendAppointmentReminder({
              candidateName: `${appointment.user.firstname || ''} ${appointment.user.lastname || ''}`.trim() || appointment.user.email,
              candidateEmail: appointment.user.email,
              companyName: appointment.company.company_name,
              companyEmail: appointment.company.contact?.email,
              appointmentDate: this.formatDate(appointment.appointmentDate),
              appointmentTime: appointment.appointmentTime,
              timezone: appointment.timezone,
            });

            // Marquer le rappel comme envoyé
            appointment.reminderSent = true;
            await appointment.save();

            remindersSent++;
            console.log(`[Appointment Reminder] Reminder sent successfully for appointment ${appointment.id}`);
          }
        } catch (error) {
          console.error(`[Appointment Reminder] Error sending reminder for appointment ${appointment.id}:`, error);
          // Continuer avec les autres rendez-vous même si un échoue
        }
      }

      console.log(`[Appointment Reminder] Sent ${remindersSent} reminders`);
    } catch (error) {
      console.error('[Appointment Reminder] Error in sendPendingReminders:', error);
    }
  }

  /**
   * Construit un objet Date à partir de la date, heure et timezone de l'entretien
   */
  private static getAppointmentDateTime(date: Date | string, time: string, timezone: string): Date {
    // Convertir la date en string au format YYYY-MM-DD
    let dateStr: string;
    if (date instanceof Date) {
      dateStr = date.toISOString().split('T')[0];
    } else {
      dateStr = String(date).split('T')[0];
    }
    
    // Combiner date et heure
    const dateTimeStr = `${dateStr}T${time}:00`;
    
    // Créer un objet Date (en UTC pour simplifier)
    // Note: Pour une gestion plus précise des timezones, utiliser une bibliothèque comme moment-timezone
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
   * Démarre le service de rappel automatique (à appeler au démarrage de l'application)
   * Vérifie toutes les 5 minutes
   */
  static startReminderService(): void {
    console.log('[Appointment Reminder] Starting reminder service...');
    
    // Exécuter immédiatement
    this.sendPendingReminders();
    
    // Puis toutes les 5 minutes
    setInterval(() => {
      this.sendPendingReminders();
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('[Appointment Reminder] Reminder service started (checking every 5 minutes)');
  }
}
