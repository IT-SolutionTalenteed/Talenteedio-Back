import { Router } from 'express';
import { listPlans, createCheckoutSession, createPortalSession, handleWebhook, createCoachingCheckoutSession } from './controllers';
import auth from '../auth/middlewares/auth-guard';

const router = Router();

// Route publique pour lister les plans (utilisée lors de l'inscription)
router.get('/billing/plans', listPlans);

// Routes protégées pour les utilisateurs authentifiés
// Note: createCheckoutSession peut aussi être utilisée sans auth pendant l'onboarding
router.post('/billing/checkout-session', createCheckoutSession);
router.post('/billing/portal-session', auth, createPortalSession);

// Route publique pour le coaching emploi
router.post('/billing/coaching-checkout', createCoachingCheckoutSession);

// Route webhook Stripe (doit utiliser express.raw pour vérifier la signature)
// Note: Cette route doit être enregistrée AVANT express.json() dans index.ts
router.post('/stripe/webhook', handleWebhook);

export default router;
