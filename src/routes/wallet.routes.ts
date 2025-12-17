import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';
import auth from '../auth/middlewares/auth-guard';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes du portefeuille (préfixe /wallet géré dans index.ts)
router.get('/', walletController.getWallet);
router.get('/transactions', walletController.getTransactions);
router.get('/stats', walletController.getStats);
router.post('/withdrawal', walletController.requestWithdrawal);
router.get('/withdrawals', walletController.getWithdrawals);
router.post('/stripe/setup', walletController.setupStripeAccount);
router.get('/stripe/status/:accountId', walletController.checkStripeAccountStatus);

export default router;