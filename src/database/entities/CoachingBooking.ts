import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('coaching_bookings')
export class CoachingBooking extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 50 })
  consultant: string;

  @Column({ type: 'varchar', length: 50 })
  serviceType: string; // 'bilan' ou 'accompagnement'

  @Column({ type: 'date' })
  bookingDate: string;

  @Column({ type: 'varchar', length: 10 })
  bookingTime: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  frequency?: string; // Pour accompagnement: 'weekly' ou 'biweekly'

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone?: string; // Fuseau horaire de l'utilisateur (ex: 'Europe/Paris')

  @Column({ type: 'int' })
  amount: number; // Montant en centimes

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSessionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // 'pending', 'paid', 'cancelled'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
