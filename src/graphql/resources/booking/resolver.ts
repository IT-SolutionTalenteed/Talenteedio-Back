import { BookingService, CreateBookingInput } from './service';
import { Booking } from '../../../database/entities/Booking';
import { Wallet } from '../../../database/entities/Wallet';

// Note: Ce resolver nécessite NestJS pour fonctionner avec GraphQL
// Pour l'instant, il sert de référence pour une future implémentation GraphQL

export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  async createBooking(input: CreateBookingInput): Promise<string> {
    try {
      const booking = await this.bookingService.createBooking(input);
      return booking.id;
    } catch (error) {
      throw new Error(`Erreur lors de la création de la réservation: ${error.message}`);
    }
  }

  async confirmBookingPayment(
    bookingId: string,
    stripePaymentIntentId: string,
  ): Promise<string> {
    try {
      const booking = await this.bookingService.confirmBookingPayment(
        bookingId,
        stripePaymentIntentId,
      );
      return booking.id;
    } catch (error) {
      throw new Error(`Erreur lors de la confirmation du paiement: ${error.message}`);
    }
  }

  async getMyBookings(context: any): Promise<Booking[]> {
    const userId = context.req.user.id;
    
    // Récupérer le consultant associé à l'utilisateur
    // Note: Vous devrez adapter cette logique selon votre structure
    const consultantId = userId; // Supposons que l'ID utilisateur = ID consultant
    
    return await this.bookingService.getBookingsByConsultant(consultantId);
  }

  async getMyWallet(context: any): Promise<Wallet | null> {
    const userId = context.req.user.id;
    const consultantId = userId; // Adapter selon votre structure
    
    return await this.bookingService.getWalletByConsultant(consultantId);
  }

  async cancelBooking(
    bookingId: string,
    context: any,
  ): Promise<string> {
    try {
      const booking = await this.bookingService.cancelBooking(bookingId);
      return booking.id;
    } catch (error) {
      throw new Error(`Erreur lors de l'annulation: ${error.message}`);
    }
  }
}