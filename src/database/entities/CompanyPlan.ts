import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class CompanyPlan extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column('simple-array', { nullable: true })
    features: string[]; // Liste des fonctionnalités incluses

    @Column({ type: 'int', default: 0 })
    maxArticles: number; // Nombre d'articles par mois

    @Column({ type: 'int', default: 0 })
    maxEvents: number; // Nombre d'événements par mois

    @Column({ type: 'int', default: 0 })
    maxJobs: number; // Nombre d'offres d'emploi par mois

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ default: 'month' })
    billingPeriod: string; // 'month', 'year'

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    displayOrder: number; // Ordre d'affichage

    @Column({ default: false })
    isPopular: boolean; // Badge "Most Popular"

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
