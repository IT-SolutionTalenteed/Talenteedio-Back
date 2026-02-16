import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MatchingProfile } from './MatchingProfile';
import { Company } from './Company';
import { User } from './User';

export enum AppointmentStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
}

@Entity()
export class CompanyAppointment extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => MatchingProfile, { onDelete: 'CASCADE' })
    @JoinColumn()
    matchingProfile: MatchingProfile;

    @Column()
    matchingProfileId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn()
    company: Company;

    @Column()
    companyId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'date' })
    appointmentDate: Date;

    @Column({ type: 'varchar', length: 10 })
    appointmentTime: string; // Format: "HH:MM"

    @Column({ type: 'varchar', length: 100, default: 'Europe/Paris' })
    timezone: string;

    @Column({ type: 'text', nullable: true })
    message: string; // Message du candidat

    @Column({ type: 'text', nullable: true })
    companyNotes: string; // Notes de l'entreprise

    @Column({ type: 'text', nullable: true })
    rejectionReason: string; // Raison du rejet

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING,
    })
    status: AppointmentStatus;

    @Column({ type: 'boolean', default: false })
    reminderSent: boolean; // Rappel envoyé 30 min avant

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
