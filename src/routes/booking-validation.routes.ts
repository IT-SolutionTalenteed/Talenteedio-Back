import { Router } from 'express';
import { BookingValidationController } from '../controllers/booking-validation.controller';

const router = Router();

// Route pour récupérer les détails d'une réservation
router.get('/booking-validation/:bookingId', async (req, res) => {
  try {
    const controller = new BookingValidationController();
    const result = await controller.getBookingDetails(req.params.bookingId);
    res.json(result);
  } catch (error: any) {
    console.error('Error in booking details route:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour valider une réservation
router.post('/booking-validation/:bookingId/validate', async (req, res) => {
  try {
    const controller = new BookingValidationController();
    const result = await controller.validateBooking(req.params.bookingId, req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in booking validation route:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;