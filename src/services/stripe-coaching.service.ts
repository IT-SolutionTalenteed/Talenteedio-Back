import { Injectable } from '@nestjs/common';
import { stripe } from '../config/stripe';
import { BookingService, CreateBookingInput } from '../graphql/resources/booking/service';
import Stripe from 'stripe';

export interface CoachingCheckoutData {
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  consultant: string;
  service: string;
  date: string;
  time: string;
  timezone: string;
  amount: number;
  frequency?: string;
  success_url: string;
  cancel_url: string;
  pricingId?: string;
  serviceDetails?: {
    id: string;
    title: string;
    description?: string;
    price: number;
    unit?: string;
    duration?: string;
    features?: string[];
  };
}

@Injectable()
export class StripeCoachingService {
  constructor(private readonly bookingService: BookingService) {}

  async createCoachingCheckoutSession(
    data: CoachingCheckoutData,
  ): Promise<{ id: string; url: string }> {
    try {
      // Créer d'abord la réservation en base de données
      const bookingInput: CreateBookingInput = {
        clientName: data.contact.name,
        clientEmail: data.contact.email,
        clientPhone: data.contact.phone,
        consultantId: data.consultant,
        pricingId: data.pricingId,
        serviceTitle: data.service,
        serviceDescription: data.serviceDetails?.description,
        bookingDate: data.date,
        bookingTime: data.time,
        timezone: data.timezone,
        amount: data.amount / 100, // Convertir de centimes en euros
        frequency: data.frequency,
        metadata: {
          serviceDetails: data.serviceDetails,
          originalAmount: data.amount,
        },
      };

      const booking = await this.bookingService.createBooking(bookingInput);

      // Créer la session Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: data.service,
                description: this.buildServiceDescription(data),
                metadata: {
                  consultant: data.consultant,
                  bookingId: booking.id,
                  date: data.date,
                  time: data.time,
                  timezone: data.timezone,
                },
              },
              unit_amount: data.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${data.success_url}?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancel_url: data.cancel_url,
        customer_email: data.contact.email,
        metadata: {
          type: 'coaching',
          bookingId: booking.id,
          consultantId: data.consultant,
          clientName: data.contact.name,
          clientPhone: data.contact.phone,
          bookingDate: data.date,
          bookingTime: data.time,
          timezone: data.timezone,
        },
        payment_intent_data: {
          metadata: {
            bookingId: booking.id,
            consultantId: data.consultant,
          },
        },
      });

      // Mettre à jour la réservation avec l'ID de session Stripe
      await this.updateBookingWithStripeSession(booking.id, session.id);

      return {
        id: session.id,
        url: session.url!,
      };
    } catch (error) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      throw new Error(`Impossible de créer la session de paiement: ${error.message}`);
    }
  }

  private buildServiceDescription(data: CoachingCheckoutData): string {
    let description = `Réservation avec ${data.consultant}\n`;
    description += `Date: ${new Date(data.date).toLocaleDateString('fr-FR')}\n`;
    description += `Heure: ${data.time} (${data.timezone})\n`;
    
    if (data.serviceDetails?.duration) {
      description += `Durée: ${data.serviceDetails.duration}\n`;
    }
    
    if (data.frequency) {
      description += `Fréquence: ${data.frequency}\n`;
    }

    return description;
  }

  private async updateBookingWithStripeSession(
    bookingId: string,
    sessionId: string,
  ): Promise<void> {
    // Cette méthode devrait être ajoutée au BookingService
    // Pour l'instant, on peut l'implémenter directement ici
    // ou ajouter une méthode au service
  }

  async handleWebhook(
    body: Buffer,
    signature: string,
    webhookSecret: string,
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const bookingId = session.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID found in session metadata');
      return;
    }

    try {
      // La confirmation sera faite lors du payment_intent.succeeded
      console.log(`Checkout session completed for booking ${bookingId}`);
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID found in payment intent metadata');
      return;
    }

    try {
      await this.bookingService.confirmBookingPayment(bookingId, paymentIntent.id);
      console.log(`Payment confirmed for booking ${bookingId}`);
    } catch (error) {
      console.error('Error confirming booking payment:', error);
    }
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID found in payment intent metadata');
      return;
    }

    try {
      await this.bookingService.cancelBooking(bookingId);
      console.log(`Booking cancelled due to payment failure: ${bookingId}`);
    } catch (error) {
      console.error('Error cancelling booking after payment failure:', error);
    }
  }
}