import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company, Event, Admin } from '.';

export enum PARTICIPATION_REQUEST_STATUS {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity()
export class EventParticipationRequest extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    event: Event;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    company: Company;

    @Column({
        type: 'enum',
        enum: PARTICIPATION_REQUEST_STATUS,
        default: PARTICIPATION_REQUEST_STATUS.PENDING,
    })
    status: PARTICIPATION_REQUEST_STATUS;

    @Column({ type: 'text', nullable: true })
    message: string; // Message de la company lors de la demande

    @Column({ type: 'text', nullable: true })
    adminNote: string; // Note de l'admin lors de l'approbation/rejet

    @ManyToOne(() => Admin, { nullable: true })
    reviewedBy: Admin; // Admin qui a traité la demande

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt: Date; // Date de traitement de la demande

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
