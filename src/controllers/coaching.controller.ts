import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { StripeCoachingService, CoachingCheckoutData } from '../services/stripe-coaching.service';
import { Request } from 'express';

@Controller('billing')
export class CoachingController {
  constructor(private readonly stripeCoachingService: StripeCoachingService) {}

  @Post('coaching-checkout')
  async createCoachingCheckout(@Body() data: CoachingCheckoutData) {
    try {
      return await this.stripeCoachingService.createCoachingCheckoutSession(data);
    } catch (error) {
      throw new Error(`Erreur lors de la création du checkout: ${error.message}`);
    }
  }

  @Post('coaching-webhook')
  async handleCoachingWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      await this.stripeCoachingService.handleWebhook(
        req.rawBody,
        signature,
        webhookSecret,
      );
      
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw new Error('Webhook processing failed');
    }
  }
}