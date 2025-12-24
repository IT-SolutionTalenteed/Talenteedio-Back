import { Request, Response } from 'express';
import { BookingService } from '../graphql/resources/booking/service';
import AppDataSource from '../database';
import { Booking } from '../database/entities/Booking';
import { Wallet } from '../database/entities/Wallet';
import { WalletTransaction } from '../database/entities/WalletTransaction';
import { Consultant } from '../database/entities/Consultant';
import { Pricing } from '../database/entities/Pricing';

interface ValidateBookingRequest {
  action: 'confirm' | 'reject';
  message?: string;
}

export class BookingValidationController {
  private bookingService: BookingService;

  constructor() {
    // Initialiser le service de booking
    this.bookingService = new BookingService(
      AppDataSource.getRepository(Booking),
      AppDataSource.getRepository(Wallet),
      AppDataSource.getRepository(WalletTransaction),
      AppDataSource.getRepository(Consultant),
      AppDataSource.getRepository(Pricing),
    );
  }

  async getBookingDetails(bookingId: string) {
    try {
      const bookingRepo = AppDataSource.getRepository(Booking);
      const booking = await bookingRepo.findOne({
        where: { id: bookingId },
        relations: ['consultant', 'pricing'],
      });

      if (!booking) {
        return { error: 'Réservation non trouvée' };
      }

      return {
        id: booking.id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        serviceTitle: booking.serviceTitle,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        timezone: booking.timezone,
        amount: booking.amount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        consultant: booking.consultant,
      };
    } catch (error) {
      console.error('Error fetching booking details:', error);
      return { error: 'Erreur lors de la récupération des détails' };
    }
  }

  async validateBooking(
    bookingId: string,
    body: ValidateBookingRequest
  ) {
    try {
      const { action, message } = body;

      if (!action || !['confirm', 'reject'].includes(action)) {
        return { error: 'Action invalide' };
      }

      const updatedBooking = await this.bookingService.validateBooking(
        bookingId,
        action,
        message
      );

      // Envoyer un email de notification au client
      await this.sendValidationNotification(updatedBooking, action, message);

      return {
        success: true,
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
          notes: updatedBooking.notes,
        },
      };
    } catch (error: any) {
      console.error('Error validating booking:', error);
      return { error: error.message || 'Erreur lors de la validation' };
    }
  }

  private async sendValidationNotification(
    booking: Booking,
    action: 'confirm' | 'reject',
    message?: string
  ): Promise<void> {
    try {
      console.log('=== Sending validation notification ===');
      console.log('Booking ID:', booking.id);
      console.log('Client Email:', booking.clientEmail);
      console.log('Action:', action);
      console.log('Pricing ID:', booking.pricingId);
      
      const { sendBookingValidationNotification } = await import('../helpers/mailer/send-booking-validation-notification');
      
      // Récupérer le lien de réunion du pricing si disponible
      let meetingLink: string | undefined;
      if (action === 'confirm' && booking.pricingId) {
        const pricingRepo = AppDataSource.getRepository(Pricing);
        const pricing = await pricingRepo.findOne({ where: { id: booking.pricingId } });
        console.log('Pricing found:', pricing ? 'Yes' : 'No');
        console.log('Meeting Link:', pricing?.meetingLink);
        meetingLink = pricing?.meetingLink;
      }
      
      const emailData = {
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        serviceName: booking.serviceTitle,
        date: booking.bookingDate instanceof Date 
          ? booking.bookingDate.toISOString().split('T')[0] 
          : String(booking.bookingDate).split('T')[0],
        time: booking.bookingTime,
        timezone: booking.timezone,
        action: action,
        consultantMessage: message,
        amount: Number(booking.amount),
        meetingLink: meetingLink,
      };
      
      console.log('Email data:', JSON.stringify(emailData, null, 2));
      
      await sendBookingValidationNotification(emailData);

      console.log(`✅ Validation notification sent to ${booking.clientEmail}`);
    } catch (error) {
      console.error('❌ Error sending validation notification:', error);
      // Ne pas faire échouer la validation si l'email échoue
    }
  }
}