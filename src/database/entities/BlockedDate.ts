import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Consultant } from './Consultant';

@Entity('blocked_dates')
export class BlockedDate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'consultant_id' })
  consultantId!: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'consultant_id' })
  consultant!: Consultant;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}