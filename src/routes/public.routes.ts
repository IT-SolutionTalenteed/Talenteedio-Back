import { Router } from 'express';
import { creneauxController } from '../controllers/creneaux.controller';

const router = Router();

// Route publique pour vérifier la disponibilité d'un créneau
router.get('/availability', creneauxController.checkPublicAvailability);

// Route publique pour récupérer les dates bloquées d'un consultant
router.get('/blocked-dates', creneauxController.getPublicBlockedDates);

export default router;