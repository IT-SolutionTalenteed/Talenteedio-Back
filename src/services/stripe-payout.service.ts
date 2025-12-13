import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

let stripe: Stripe | null = null;

// Initialiser Stripe seulement si la clé est configurée
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

export class StripePayoutService {
  /**
   * Créer un compte Stripe Express pour un consultant
   */
  static async createExpressAccount(email: string, consultantId: string) {
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré sur ce serveur');
    }

    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        metadata: {
          consultantId,
        },
      });

      return account;
    } catch (error: any) {
      console.error('Error creating Stripe Express account:', error);
      console.error('Stripe error details:', error.message, error.code, error.type);
      throw new Error(`Impossible de créer le compte Stripe: ${error.message}`);
    }
  }

  /**
   * Créer un lien d'onboarding pour un compte Express
   */
  static async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré sur ce serveur');
    }

    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw new Error('Impossible de créer le lien d\'onboarding');
    }
  }

  /**
   * Vérifier le statut d'un compte Express
   */
  static async getAccountStatus(accountId: string) {
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré sur ce serveur');
    }

    try {
      const account = await stripe.accounts.retrieve(accountId);
      
      return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        canReceivePayouts: account.charges_enabled && account.payouts_enabled,
      };
    } catch (error) {
      console.error('Error retrieving account status:', error);
      throw new Error('Impossible de récupérer le statut du compte');
    }
  }

  /**
   * Vérifier si un compte peut recevoir des paiements
   */
  static async canAccountReceivePayouts(accountId: string): Promise<boolean> {
    try {
      const status = await this.getAccountStatus(accountId);
      return status.canReceivePayouts;
    } catch (error) {
      console.error('Error checking payout capability:', error);
      return false;
    }
  }

  /**
   * Effectuer un transfert vers un compte Express
   */
  static async createTransfer(accountId: string, amount: number, currency = 'eur', description?: string) {
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré sur ce serveur');
    }

    try {
      // Convertir en centimes pour Stripe
      const amountInCents = Math.round(amount * 100);

      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency,
        destination: accountId,
        description: description || 'Retrait de gains',
      });

      return transfer;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw new Error('Impossible d\'effectuer le transfert');
    }
  }

  /**
   * Récupérer l'historique des transferts pour un compte
   */
  static async getTransfers(accountId: string, limit = 10) {
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré sur ce serveur');
    }

    try {
      const transfers = await stripe.transfers.list({
        destination: accountId,
        limit,
      });

      return transfers.data;
    } catch (error) {
      console.error('Error retrieving transfers:', error);
      throw new Error('Impossible de récupérer l\'historique des transferts');
    }
  }

  /**
   * Créer un lien de dashboard pour un compte Express
   */
  static async createDashboardLink(accountId: string) {
    if (!stripe) {
      throw new Error('Stripe n\'est pas configuré sur ce serveur');
    }

    try {
      const link = await stripe.accounts.createLoginLink(accountId);
      return link;
    } catch (error) {
      console.error('Error creating dashboard link:', error);
      throw new Error('Impossible de créer le lien dashboard');
    }
  }
}