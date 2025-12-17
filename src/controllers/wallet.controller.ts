import { Request, Response } from 'express';
import AppDataSource from '../database';
import { Wallet } from '../database/entities/Wallet';
import { WalletTransaction, TransactionType, TransactionSource } from '../database/entities/WalletTransaction';
import { Consultant } from '../database/entities/Consultant';
import { User } from '../database/entities/User';
import { StripePayoutService } from '../services/stripe-payout.service';

interface AuthenticatedRequest extends Request {
  session: any;
}

// Helper function to get consultant from user
const getConsultantFromUser = async (user: User): Promise<Consultant | null> => {
  const consultantRepo = AppDataSource.getRepository(Consultant);
  return await consultantRepo
    .createQueryBuilder('consultant')
    .leftJoinAndSelect('consultant.user', 'user')
    .where('user.id = :userId', { userId: user.id })
    .getOne();
};

export const walletController = {
  // Récupérer le portefeuille du consultant connecté
  async getWallet(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      // Vérifier que l'utilisateur est un consultant
      const consultant = await getConsultantFromUser(user);

      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const walletRepo = AppDataSource.getRepository(Wallet);
      let wallet = await walletRepo.findOne({
        where: { consultantId: consultant.id },
        relations: ['consultant'],
      });

      // Créer le portefeuille s'il n'existe pas
      if (!wallet) {
        wallet = walletRepo.create({
          consultantId: consultant.id,
          balance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          currency: 'EUR',
          isActive: true,
        });
        wallet = await walletRepo.save(wallet);
      }

      res.json(wallet);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Récupérer l'historique des transactions
  async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      // Vérifier que l'utilisateur est un consultant
      const consultant = await getConsultantFromUser(user);

      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const walletRepo = AppDataSource.getRepository(Wallet);
      const wallet = await walletRepo.findOne({
        where: { consultantId: consultant.id },
      });

      if (!wallet) {
        return res.json([]);
      }

      const { type, source, limit = 50, offset = 0 } = req.query;

      const transactionRepo = AppDataSource.getRepository(WalletTransaction);
      const queryBuilder = transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.booking', 'booking')
        .where('transaction.walletId = :walletId', { walletId: wallet.id })
        .orderBy('transaction.createdAt', 'DESC')
        .limit(Number(limit))
        .offset(Number(offset));

      if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }

      if (source) {
        queryBuilder.andWhere('transaction.source = :source', { source });
      }

      const transactions = await queryBuilder.getMany();

      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Récupérer les statistiques du portefeuille
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      // Vérifier que l'utilisateur est un consultant
      const consultant = await getConsultantFromUser(user);

      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const walletRepo = AppDataSource.getRepository(Wallet);
      const wallet = await walletRepo.findOne({
        where: { consultantId: consultant.id },
      });

      if (!wallet) {
        return res.json({
          totalEarnings: 0,
          monthlyEarnings: 0,
          monthlyWithdrawals: 0,
          totalWithdrawals: 0,
        });
      }

      const transactionRepo = AppDataSource.getRepository(WalletTransaction);
      
      // Gains du mois en cours
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthlyEarnings = await transactionRepo
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.walletId = :walletId', { walletId: wallet.id })
        .andWhere('transaction.type = :type', { type: TransactionType.CREDIT })
        .andWhere('transaction.source = :source', { source: TransactionSource.BOOKING })
        .andWhere('transaction.createdAt >= :start', { start: currentMonth })
        .andWhere('transaction.createdAt < :end', { end: nextMonth })
        .getRawOne();

      // Retraits du mois en cours
      const monthlyWithdrawals = await transactionRepo
        .createQueryBuilder('transaction')
        .select('SUM(ABS(transaction.amount))', 'total')
        .where('transaction.walletId = :walletId', { walletId: wallet.id })
        .andWhere('transaction.source = :source', { source: TransactionSource.WITHDRAWAL })
        .andWhere('transaction.createdAt >= :start', { start: currentMonth })
        .andWhere('transaction.createdAt < :end', { end: nextMonth })
        .getRawOne();

      // Total des retraits
      const totalWithdrawals = await transactionRepo
        .createQueryBuilder('transaction')
        .select('SUM(ABS(transaction.amount))', 'total')
        .where('transaction.walletId = :walletId', { walletId: wallet.id })
        .andWhere('transaction.source = :source', { source: TransactionSource.WITHDRAWAL })
        .getRawOne();

      res.json({
        totalEarnings: wallet.totalEarnings,
        monthlyEarnings: Number(monthlyEarnings?.total || 0),
        monthlyWithdrawals: Number(monthlyWithdrawals?.total || 0),
        totalWithdrawals: Number(totalWithdrawals?.total || 0),
      });
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Demander un retrait
  async requestWithdrawal(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      // Vérifier que l'utilisateur est un consultant
      const consultant = await getConsultantFromUser(user);

      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const { amount, method, iban, paypalEmail, stripeEmail, note } = req.body;

      // Validation
      if (!amount || amount < 10) {
        return res.status(400).json({ message: 'Le montant minimum est de 10€' });
      }

      if (!method || !['bank_transfer', 'paypal', 'stripe'].includes(method)) {
        return res.status(400).json({ message: 'Méthode de paiement invalide' });
      }

      if (method === 'bank_transfer' && !iban) {
        return res.status(400).json({ message: 'IBAN requis pour le virement bancaire' });
      }

      if (method === 'paypal' && !paypalEmail) {
        return res.status(400).json({ message: 'Email PayPal requis' });
      }

      if (method === 'stripe' && !req.body.stripeEmail) {
        return res.status(400).json({ message: 'Email Stripe requis' });
      }

      const walletRepo = AppDataSource.getRepository(Wallet);
      const wallet = await walletRepo.findOne({
        where: { consultantId: consultant.id },
      });

      if (!wallet) {
        return res.status(404).json({ message: 'Portefeuille non trouvé' });
      }

      if (wallet.balance < amount) {
        return res.status(400).json({ message: 'Solde insuffisant' });
      }

      // Créer la transaction de retrait
      const transactionRepo = AppDataSource.getRepository(WalletTransaction);
      
      await AppDataSource.transaction(async (manager) => {
        // Débiter le portefeuille
        wallet.balance = Number(wallet.balance) - amount;
        await manager.save(wallet);

        let stripeTransferId = undefined;
        let transactionStatus = 'pending';

        // Si c'est Stripe, effectuer le transfert immédiatement
        if (method === 'stripe') {
          try {
            // Pour l'instant, on simule un compte Stripe
            // En production, il faudrait récupérer l'accountId du consultant
            const mockAccountId = 'acct_mock_' + consultant.id;
            
            // Créer le transfert Stripe
            const transfer = await StripePayoutService.createTransfer(
              mockAccountId,
              amount,
              'eur',
              `Retrait consultant ${consultant.id}`
            );
            
            stripeTransferId = transfer.id;
            transactionStatus = 'completed';
          } catch (error) {
            console.error('Stripe transfer failed:', error);
            // En cas d'erreur, on garde le statut pending pour traitement manuel
            transactionStatus = 'failed';
          }
        }

        // Créer la transaction
        const transaction = manager.create(WalletTransaction, {
          walletId: wallet.id,
          type: TransactionType.DEBIT,
          source: TransactionSource.WITHDRAWAL,
          amount: -amount,
          balanceAfter: wallet.balance,
          currency: 'EUR',
          description: `Demande de retrait - ${method === 'bank_transfer' ? 'Virement bancaire' : method === 'paypal' ? 'PayPal' : 'Stripe'}`,
          metadata: {
            method,
            iban: method === 'bank_transfer' ? iban : undefined,
            paypalEmail: method === 'paypal' ? paypalEmail : undefined,
            stripeEmail: method === 'stripe' ? stripeEmail : undefined,
            stripeTransferId,
            note,
            status: transactionStatus,
          },
        });

        await manager.save(transaction);
      });

      res.json({ message: 'Demande de retrait créée avec succès' });
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Créer ou récupérer un compte Stripe Express
  async setupStripeAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = await getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      // Mode simulation si Stripe n'est pas configuré
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.json({
          accountId: 'mock_' + consultant.id,
          status: 'simulated',
          message: 'Mode simulation - Stripe non configuré sur ce serveur'
        });
      }

      try {
        // Créer un nouveau compte Stripe Express
        console.log('Creating new Stripe Express account for:', user.email);
        const account = await StripePayoutService.createExpressAccount(
          user.email,
          consultant.id
        );

        console.log('Stripe account created:', account.id);

        // Créer le lien d'onboarding
        const accountLink = await StripePayoutService.createAccountLink(
          account.id,
          `${process.env.FRONTEND_HOST}/admin/wallet?refresh=true`,
          `${process.env.FRONTEND_HOST}/admin/wallet?success=true`
        );

        console.log('Onboarding link created:', accountLink.url);

        return res.json({
          accountId: account.id,
          status: 'created',
          onboardingUrl: accountLink.url,
          message: 'Nouveau compte Stripe créé ! Cliquez pour compléter votre profil sur Stripe.'
        });
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError);
        
        // Erreur spécifique pour Connect non activé
        if (stripeError.message && stripeError.message.includes('signed up for Connect')) {
          return res.status(400).json({
            message: 'Stripe Connect n\'est pas encore activé. Allez sur votre dashboard Stripe > Connect pour l\'activer.',
            connectUrl: 'https://dashboard.stripe.com/connect/overview'
          });
        }
        
        return res.status(500).json({
          message: 'Erreur lors de la création du compte Stripe: ' + stripeError.message
        });
      }
    } catch (error) {
      console.error('Error setting up Stripe account:', error);
      res.status(500).json({ message: 'Erreur lors de la configuration Stripe' });
    }
  },

  // Vérifier le statut d'un compte Stripe
  async checkStripeAccountStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = await getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const { accountId } = req.params;
      
      if (!accountId) {
        return res.status(400).json({ message: 'Account ID requis' });
      }

      try {
        const accountStatus = await StripePayoutService.getAccountStatus(accountId);
        
        return res.json({
          accountId: accountStatus.id,
          chargesEnabled: accountStatus.chargesEnabled,
          payoutsEnabled: accountStatus.payoutsEnabled,
          canReceivePayouts: accountStatus.canReceivePayouts,
          detailsSubmitted: accountStatus.detailsSubmitted,
          requirements: accountStatus.requirements,
          message: accountStatus.canReceivePayouts 
            ? 'Compte prêt pour les retraits !' 
            : 'Onboarding non terminé ou informations manquantes'
        });
      } catch (error) {
        return res.status(404).json({ message: 'Compte Stripe non trouvé' });
      }
    } catch (error) {
      console.error('Error checking Stripe account status:', error);
      res.status(500).json({ message: 'Erreur lors de la vérification du statut' });
    }
  },

  // Récupérer l'historique des retraits
  async getWithdrawals(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      // Vérifier que l'utilisateur est un consultant
      const consultant = await getConsultantFromUser(user);

      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const walletRepo = AppDataSource.getRepository(Wallet);
      const wallet = await walletRepo.findOne({
        where: { consultantId: consultant.id },
      });

      if (!wallet) {
        return res.json([]);
      }

      const transactionRepo = AppDataSource.getRepository(WalletTransaction);
      const withdrawals = await transactionRepo.find({
        where: {
          walletId: wallet.id,
          source: TransactionSource.WITHDRAWAL,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      res.json(withdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },
};