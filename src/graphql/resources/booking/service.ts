import { Repository } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from '../../../database/entities/Booking';
import { Wallet } from '../../../database/entities/Wallet';
import { WalletTransaction, TransactionType, TransactionSource } from '../../../database/entities/WalletTransaction';
import { Consultant } from '../../../database/entities/Consultant';
import { Pricing } from '../../../database/entities/Pricing';

export interface CreateBookingInput {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  consultantId: string;
  pricingId?: string;
  serviceTitle: string;
  serviceDescription?: string;
  bookingDate: string;
  bookingTime: string;
  timezone: string;
  amount: number;
  frequency?: string;
  stripeSessionId?: string;
  metadata?: Record<string, any>;
}

export class BookingService {
  constructor(
    private bookingRepository: Repository<Booking>,
    private walletRepository: Repository<Wallet>,
    private walletTransactionRepository: Repository<WalletTransaction>,
    private consultantRepository: Repository<Consultant>,
    private pricingRepository: Repository<Pricing>,
  ) {}

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    // Vérifier que le consultant existe
    const consultant = await this.consultantRepository.findOne({
      where: { id: input.consultantId },
    });

    if (!consultant) {
      throw new Error('Consultant non trouvé');
    }

    // Vérifier la disponibilité du créneau
    await this.checkAvailability(input.consultantId, input.bookingDate, input.bookingTime);

    // Vérifier le pricing si fourni
    let pricing: Pricing | undefined;
    if (input.pricingId) {
      const foundPricing = await this.pricingRepository.findOne({
        where: { id: input.pricingId },
        relations: ['consultant'],
      });

      if (!foundPricing) {
        throw new Error('Tarif non trouvé');
      }

      pricing = foundPricing;

      // Vérifier que le pricing appartient au consultant
      if (pricing.consultant?.id !== input.consultantId) {
        throw new Error('Ce tarif n\'appartient pas au consultant sélectionné');
      }
    }

    // Créer la réservation
    const booking = this.bookingRepository.create({
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      consultantId: input.consultantId,
      pricingId: input.pricingId,
      serviceTitle: input.serviceTitle,
      serviceDescription: input.serviceDescription,
      bookingDate: new Date(input.bookingDate),
      bookingTime: input.bookingTime,
      timezone: input.timezone,
      amount: input.amount,
      frequency: input.frequency,
      stripeSessionId: input.stripeSessionId,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      metadata: input.metadata,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // Créer une transaction en attente dans le portefeuille
    await this.createPendingWalletTransaction(savedBooking);

    return savedBooking;
  }

  async confirmBookingPayment(
    bookingId: string,
    stripePaymentIntentId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['consultant'],
    });

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Mettre à jour le statut de la réservation - en attente de validation du consultant
    booking.status = BookingStatus.AWAITING_VALIDATION;
    booking.paymentStatus = PaymentStatus.PAID;
    booking.stripePaymentIntentId = stripePaymentIntentId;

    const updatedBooking = await this.bookingRepository.save(booking);

    // Confirmer la transaction dans le portefeuille (l'argent est déjà reçu)
    await this.confirmWalletTransaction(booking);

    return updatedBooking;
  }

  async validateBooking(
    bookingId: string,
    action: 'confirm' | 'reject',
    consultantMessage?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['consultant'],
    });

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    if (booking.status !== BookingStatus.AWAITING_VALIDATION) {
      throw new Error('Cette réservation ne peut plus être validée');
    }

    if (action === 'confirm') {
      booking.status = BookingStatus.CONFIRMED;
      booking.notes = consultantMessage || 'Réservation confirmée par le consultant';
    } else {
      booking.status = BookingStatus.REJECTED;
      booking.notes = consultantMessage || 'Réservation refusée par le consultant';
      
      // Si rejetée, rembourser le client (annuler la transaction wallet)
      await this.refundBooking(booking);
    }

    const updatedBooking = await this.bookingRepository.save(booking);
    return updatedBooking;
  }

  private async refundBooking(booking: Booking): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { consultantId: booking.consultantId },
    });

    if (!wallet) return;

    const amount = Number(booking.amount);

    // Débiter le solde du consultant
    wallet.balance = Number(wallet.balance) - amount;
    wallet.totalEarnings = Number(wallet.totalEarnings) - amount;

    await this.walletRepository.save(wallet);

    // Créer une transaction de remboursement
    const transaction = this.walletTransactionRepository.create({
      walletId: wallet.id,
      bookingId: booking.id,
      type: TransactionType.DEBIT,
      source: TransactionSource.REFUND,
      amount: -amount,
      balanceAfter: wallet.balance,
      description: `Remboursement - ${booking.serviceTitle} (réservation rejetée)`,
    });

    await this.walletTransactionRepository.save(transaction);
  }

  private async createPendingWalletTransaction(booking: Booking): Promise<void> {
    // Récupérer ou créer le portefeuille du consultant
    let wallet = await this.walletRepository.findOne({
      where: { consultantId: booking.consultantId },
    });

    if (!wallet) {
      wallet = await this.createWalletForConsultant(booking.consultantId);
    }

    // Ajouter le montant au solde en attente
    wallet.pendingBalance = Number(wallet.pendingBalance) + Number(booking.amount);
    await this.walletRepository.save(wallet);

    // Créer la transaction en attente
    const transaction = this.walletTransactionRepository.create({
      walletId: wallet.id,
      bookingId: booking.id,
      type: TransactionType.PENDING,
      source: TransactionSource.BOOKING,
      amount: booking.amount,
      balanceAfter: wallet.balance,
      description: `Réservation en attente - ${booking.serviceTitle}`,
      reference: booking.stripeSessionId,
    });

    await this.walletTransactionRepository.save(transaction);
  }

  private async confirmWalletTransaction(booking: Booking): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { consultantId: booking.consultantId },
    });

    if (!wallet) {
      throw new Error('Portefeuille non trouvé');
    }

    // Transférer du solde en attente vers le solde confirmé
    const amount = Number(booking.amount);
    wallet.pendingBalance = Number(wallet.pendingBalance) - amount;
    wallet.balance = Number(wallet.balance) + amount;
    wallet.totalEarnings = Number(wallet.totalEarnings) + amount;

    await this.walletRepository.save(wallet);

    // Mettre à jour la transaction existante
    const pendingTransaction = await this.walletTransactionRepository.findOne({
      where: {
        bookingId: booking.id,
        type: TransactionType.PENDING,
      },
    });

    if (pendingTransaction) {
      pendingTransaction.type = TransactionType.CREDIT;
      pendingTransaction.balanceAfter = wallet.balance;
      pendingTransaction.description = `Paiement confirmé - ${booking.serviceTitle}`;
      pendingTransaction.reference = booking.stripePaymentIntentId;

      await this.walletTransactionRepository.save(pendingTransaction);
    }
  }

  private async createWalletForConsultant(consultantId: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({
      consultantId,
      balance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
    });

    return await this.walletRepository.save(wallet);
  }

  async getBookingsByConsultant(consultantId: string): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: { consultantId },
      relations: ['pricing'],
      order: { createdAt: 'DESC' },
    });
  }

  async getWalletByConsultant(consultantId: string): Promise<Wallet | null> {
    return await this.walletRepository.findOne({
      where: { consultantId },
      relations: ['transactions'],
    });
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.paymentStatus = PaymentStatus.REFUNDED;

    const updatedBooking = await this.bookingRepository.save(booking);

    // Annuler la transaction dans le portefeuille
    await this.cancelWalletTransaction(booking);

    return updatedBooking;
  }

  private async cancelWalletTransaction(booking: Booking): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { consultantId: booking.consultantId },
    });

    if (!wallet) return;

    const amount = Number(booking.amount);

    // Si le paiement était confirmé, débiter le solde
    if (booking.paymentStatus === PaymentStatus.PAID) {
      wallet.balance = Number(wallet.balance) - amount;
      wallet.totalEarnings = Number(wallet.totalEarnings) - amount;
    } else {
      // Sinon, retirer du solde en attente
      wallet.pendingBalance = Number(wallet.pendingBalance) - amount;
    }

    await this.walletRepository.save(wallet);

    // Créer une transaction d'annulation
    const transaction = this.walletTransactionRepository.create({
      walletId: wallet.id,
      bookingId: booking.id,
      type: TransactionType.CANCELLED,
      source: TransactionSource.REFUND,
      amount: -amount,
      balanceAfter: wallet.balance,
      description: `Annulation - ${booking.serviceTitle}`,
    });

    await this.walletTransactionRepository.save(transaction);
  }

  private async checkAvailability(consultantId: string, date: string, time: string): Promise<void> {
    // Importer les entités nécessaires
    const AppDataSource = (await import('../../../database')).default;
    const { BlockedDate } = await import('../../../database/entities/BlockedDate');
    
    // Vérifier si la date est bloquée
    const blockedDateRepo = AppDataSource.getRepository(BlockedDate);
    const isBlocked = await blockedDateRepo.findOne({
      where: { consultantId, date },
    });

    if (isBlocked) {
      throw new Error('Cette date n\'est pas disponible');
    }

    // Vérifier si le créneau est déjà réservé
    const existingBooking = await this.bookingRepository.findOne({
      where: { 
        consultantId, 
        bookingDate: new Date(date), 
        bookingTime: time,
        status: BookingStatus.CONFIRMED
      },
    });

    if (existingBooking) {
      throw new Error('Ce créneau horaire est déjà réservé');
    }
  }
}