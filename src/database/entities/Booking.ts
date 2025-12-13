import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Consultant } from './Consultant';
import { Pricing } from './Pricing';

export enum BookingStatus {
  PENDING = 'pending',
  AWAITING_VALIDATION = 'awaiting_validation',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 255 })
  clientEmail: string;

  @Column({ type: 'varchar', length: 50 })
  clientPhone: string;

  @Column({ type: 'uuid', nullable: true })
  clientId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client?: User;

  @Column({ type: 'uuid' })
  consultantId: string;

  @ManyToOne(() => Consultant, { eager: true })
  @JoinColumn({ name: 'consultantId' })
  consultant: Consultant;

  @Column({ type: 'uuid', nullable: true })
  pricingId?: string;

  @ManyToOne(() => Pricing, { nullable: true, eager: true })
  @JoinColumn({ name: 'pricingId' })
  pricing?: Pricing;

  @Column({ type: 'varchar', length: 255 })
  serviceTitle: string;

  @Column({ type: 'text', nullable: true })
  serviceDescription?: string;

  @Column({ type: 'date' })
  bookingDate: Date;

  @Column({ type: 'time' })
  bookingTime: string;

  @Column({ type: 'varchar', length: 100 })
  timezone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSessionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  frequency?: string; // Pour les accompagnements

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}