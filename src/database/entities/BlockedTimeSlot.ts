import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('blocked_time_slots')
@Index(['consultantId', 'date', 'time'], { unique: true })
export class BlockedTimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}