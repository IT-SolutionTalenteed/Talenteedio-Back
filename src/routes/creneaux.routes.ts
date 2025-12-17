import { Router } from 'express';
import { creneauxController } from '../controllers/creneaux.controller';
import auth from '../auth/middlewares/auth-guard';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes des créneaux
router.get('/bookings', creneauxController.getBookings);
router.get('/blocked-dates', creneauxController.getBlockedDates);
router.post('/block-date', creneauxController.blockDate);
router.delete('/unblock-date/:date', creneauxController.unblockDate);
router.get('/blocked-time-slots', creneauxController.getBlockedTimeSlots);
router.post('/block-time-slot', creneauxController.blockTimeSlot);
router.delete('/unblock-time-slot/:date/:time', creneauxController.unblockTimeSlot);
router.get('/check-availability/:consultantId', creneauxController.checkAvailability);

export default router;