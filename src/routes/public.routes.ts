import { Router } from 'express';
import { creneauxController } from '../controllers/creneaux.controller';
import { extractCVDataController } from '../controllers/cv-extraction.controller';
import multer from 'multer';

const router = Router();

// Configuration multer pour l'upload de fichiers
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Route publique pour extraire les données d'un CV
router.post('/extract-cv-data', upload.single('cv'), extractCVDataController.extractCVData);

// Route publique pour vérifier la disponibilité d'un créneau
router.get('/availability', creneauxController.checkPublicAvailability);

// Route publique pour récupérer les dates bloquées d'un consultant
router.get('/blocked-dates', creneauxController.getPublicBlockedDates);

export default router;