import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Consultant } from './Consultant';
import { WalletTransaction } from './WalletTransaction';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  consultantId: string;

  @OneToOne(() => Consultant, { eager: true })
  @JoinColumn({ name: 'consultantId' })
  consultant: Consultant;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  pendingBalance: number; // Montant en attente (réservations non confirmées)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalEarnings: number; // Total des gains depuis la création

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => WalletTransaction, transaction => transaction.wallet)
  transactions: WalletTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}