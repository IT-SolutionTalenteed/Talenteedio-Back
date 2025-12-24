import { Request, Response } from 'express';
import AppDataSource from '../database';
import { Booking } from '../database/entities/Booking';
import { BlockedDate } from '../database/entities/BlockedDate';
import { BlockedTimeSlot } from '../database/entities/BlockedTimeSlot';
import { Consultant } from '../database/entities/Consultant';
import { User } from '../database/entities/User';

interface AuthenticatedRequest extends Request {
  session: any;
}

// Helper function to get consultant from user (utilise la relation déjà chargée par le middleware)
const getConsultantFromUser = (user: User): Consultant | null => {
  // Le middleware auth-guard charge déjà la relation consultant
  if (user.consultant) {
    return user.consultant;
  }
  return null;
};

export const creneauxController = {
  // Récupérer les réservations du consultant connecté
  async getBookings(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const bookingRepo = AppDataSource.getRepository(Booking);
      const bookings = await bookingRepo.find({
        where: { consultantId: consultant.id },
        order: { bookingDate: 'ASC', bookingTime: 'ASC' },
      });

      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Récupérer les dates bloquées du consultant connecté
  async getBlockedDates(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const blockedDateRepo = AppDataSource.getRepository(BlockedDate);
      const blockedDates = await blockedDateRepo.find({
        where: { consultantId: consultant.id },
        order: { date: 'ASC' },
      });

      res.json(blockedDates);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Bloquer une date
  async blockDate(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const { date, reason } = req.body;

      if (!date) {
        return res.status(400).json({ message: 'Date requise' });
      }

      // Vérifier que la date n'est pas déjà bloquée
      const blockedDateRepo = AppDataSource.getRepository(BlockedDate);
      const existingBlock = await blockedDateRepo.findOne({
        where: { consultantId: consultant.id, date },
      });

      if (existingBlock) {
        return res.status(400).json({ message: 'Cette date est déjà bloquée' });
      }

      // Vérifier qu'il n'y a pas de réservations confirmées pour cette date
      const bookingRepo = AppDataSource.getRepository(Booking);
      const existingBookings = await bookingRepo.find({
        where: { 
          consultantId: consultant.id, 
          bookingDate: new Date(date),
          status: 'confirmed' as any
        },
      });

      if (existingBookings.length > 0) {
        return res.status(400).json({ 
          message: `Impossible de bloquer cette date : ${existingBookings.length} réservation(s) confirmée(s) existe(nt)` 
        });
      }

      // Créer le blocage
      const blockedDate = blockedDateRepo.create({
        consultantId: consultant.id,
        date,
        reason,
      });

      await blockedDateRepo.save(blockedDate);

      res.json(blockedDate);
    } catch (error) {
      console.error('Error blocking date:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Débloquer une date
  async unblockDate(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const { date } = req.params;

      const blockedDateRepo = AppDataSource.getRepository(BlockedDate);
      const blockedDate = await blockedDateRepo.findOne({
        where: { consultantId: consultant.id, date },
      });

      if (!blockedDate) {
        return res.status(404).json({ message: 'Date bloquée non trouvée' });
      }

      await blockedDateRepo.remove(blockedDate);

      res.json({ message: 'Date débloquée avec succès' });
    } catch (error) {
      console.error('Error unblocking date:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Vérifier la disponibilité d'un créneau
  async checkAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const { date, time } = req.query;
      const { consultantId } = req.params;

      if (!date || !time || !consultantId) {
        return res.status(400).json({ message: 'Date, heure et consultant requis' });
      }

      // Vérifier si la date est bloquée
      const blockedDateRepo = AppDataSource.getRepository(BlockedDate);
      const isBlocked = await blockedDateRepo.findOne({
        where: { consultantId: consultantId as string, date: date as string },
      });

      if (isBlocked) {
        return res.json({ available: false, reason: 'Date bloquée par le consultant' });
      }

      // Vérifier si le créneau est déjà réservé
      const bookingRepo = AppDataSource.getRepository(Booking);
      const existingBooking = await bookingRepo.findOne({
        where: { 
          consultantId: consultantId as string, 
          bookingDate: new Date(date as string), 
          bookingTime: time as string,
          status: 'confirmed' as any
        },
      });

      if (existingBooking) {
        return res.json({ available: false, reason: 'Créneau déjà réservé' });
      }

      res.json({ available: true });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Récupérer les créneaux horaires bloqués du consultant connecté
  async getBlockedTimeSlots(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const blockedTimeSlotRepo = AppDataSource.getRepository(BlockedTimeSlot);
      const blockedTimeSlots = await blockedTimeSlotRepo.find({
        where: { consultantId: consultant.id },
        order: { date: 'ASC', time: 'ASC' },
      });

      res.json(blockedTimeSlots);
    } catch (error) {
      console.error('Error fetching blocked time slots:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Bloquer un créneau horaire spécifique
  async blockTimeSlot(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const { date, time, reason } = req.body;

      if (!date || !time) {
        return res.status(400).json({ message: 'Date et heure requises' });
      }

      // Vérifier que le créneau n'est pas déjà bloqué
      const blockedTimeSlotRepo = AppDataSource.getRepository(BlockedTimeSlot);
      const existingBlock = await blockedTimeSlotRepo.findOne({
        where: { consultantId: consultant.id, date, time },
      });

      if (existingBlock) {
        return res.status(400).json({ message: 'Ce créneau est déjà bloqué' });
      }

      // Vérifier qu'il n'y a pas de réservation confirmée pour ce créneau
      const bookingRepo = AppDataSource.getRepository(Booking);
      const existingBooking = await bookingRepo.findOne({
        where: { 
          consultantId: consultant.id, 
          bookingDate: new Date(date),
          bookingTime: time,
          status: 'confirmed' as any
        },
      });

      if (existingBooking) {
        return res.status(400).json({ 
          message: 'Impossible de bloquer ce créneau : une réservation confirmée existe' 
        });
      }

      // Créer le blocage
      const blockedTimeSlot = blockedTimeSlotRepo.create({
        consultantId: consultant.id,
        date,
        time,
        reason,
      });

      await blockedTimeSlotRepo.save(blockedTimeSlot);

      res.json(blockedTimeSlot);
    } catch (error) {
      console.error('Error blocking time slot:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // Débloquer un créneau horaire
  async unblockTimeSlot(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const consultant = getConsultantFromUser(user);
      if (!consultant) {
        return res.status(403).json({ message: 'Accès réservé aux consultants' });
      }

      const { date, time } = req.params;

      const blockedTimeSlotRepo = AppDataSource.getRepository(BlockedTimeSlot);
      const blockedTimeSlot = await blockedTimeSlotRepo.findOne({
        where: { consultantId: consultant.id, date, time },
      });

      if (!blockedTimeSlot) {
        return res.status(404).json({ message: 'Créneau bloqué non trouvé' });
      }

      await blockedTimeSlotRepo.remove(blockedTimeSlot);

      res.json({ message: 'Créneau débloqué avec succès' });
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // API publique pour récupérer les dates bloquées d'un consultant
  async getPublicBlockedDates(req: Request, res: Response) {
    try {
      const { consultantId } = req.query;

      if (!consultantId) {
        return res.status(400).json({ message: 'Consultant requis' });
      }

      const blockedDateRepo = AppDataSource.getRepository(BlockedDate);
      const blockedDates = await blockedDateRepo.find({
        where: { consultantId: consultantId as string },
        order: { date: 'ASC' },
      });

      // Retourner seulement les dates (pas les raisons pour la confidentialité)
      const dates = blockedDates.map(bd => bd.date);
      res.json({ blockedDates: dates });
    } catch (error) {
      console.error('Error fetching public blocked dates:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },

  // API publique pour vérifier la disponibilité (utilisée par le frontend de réservation)
  async checkPublicAvailability(req: Request, res: Response) {
    try {
      const { consultantId, date, time } = req.query;

      if (!consultantId || !date || !time) {
        return res.status(400).json({ message: 'Consultant, date et heure requis' });
      }

      // Vérifier si la date entière est bloquée
      const blockedDateRepo = AppDataSource.getRepository(BlockedDate);
      const isDateBlocked = await blockedDateRepo.findOne({
        where: { consultantId: consultantId as string, date: date as string },
      });

      if (isDateBlocked) {
        return res.json({ available: false, reason: 'Date non disponible' });
      }

      // Vérifier si le créneau horaire spécifique est bloqué
      const blockedTimeSlotRepo = AppDataSource.getRepository(BlockedTimeSlot);
      const isTimeSlotBlocked = await blockedTimeSlotRepo.findOne({
        where: { 
          consultantId: consultantId as string, 
          date: date as string, 
          time: time as string 
        },
      });

      if (isTimeSlotBlocked) {
        return res.json({ available: false, reason: 'Créneau non disponible' });
      }

      // Vérifier si le créneau est déjà réservé
      const bookingRepo = AppDataSource.getRepository(Booking);
      const existingBooking = await bookingRepo.findOne({
        where: { 
          consultantId: consultantId as string, 
          bookingDate: new Date(date as string), 
          bookingTime: time as string,
          status: 'confirmed' as any
        },
      });

      if (existingBooking) {
        return res.json({ available: false, reason: 'Créneau non disponible' });
      }

      res.json({ available: true });
    } catch (error) {
      console.error('Error checking public availability:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
};