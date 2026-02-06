import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User, Event, Company } from '.';

export enum RESERVATION_STATUS {
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
}

@Entity()
export class EventUserReservation extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    event: Event;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    companyStand: Company; // Company dont l'utilisateur réserve le stand

    @Column({
        type: 'enum',
        enum: RESERVATION_STATUS,
        default: RESERVATION_STATUS.CONFIRMED,
    })
    status: RESERVATION_STATUS;

    @Column({ type: 'text', nullable: true })
    notes: string; // Notes de l'utilisateur

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
