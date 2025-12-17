import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Consultant } from './Consultant';

@Entity()
export class Pricing extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ nullable: true })
    unit: string; // 'hour', 'day', 'project', etc.

    @Column({ nullable: true })
    duration: string; // '2 heures', '1 mois', etc.

    @Column('json', { nullable: true })
    features: string[]; // Liste des prestations incluses

    @Column({ nullable: true })
    meetingLink: string; // Lien de réunion envoyé par email après paiement

    @ManyToOne(() => Consultant, (consultant) => consultant.pricings, {
        onDelete: 'CASCADE',
    })
    consultant: Consultant;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
