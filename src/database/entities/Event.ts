import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Admin, Category, Company } from '.';

enum STATUS {
    PUBLIC = 'public',
    DRAFT = 'draft',
    BLOCKED = 'blocked',
    IN_REVIEW = 'in_review',
}

@Entity()
export class Event extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'text', nullable: true })
    metaDescription: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'time', nullable: true })
    startTime: string; // Heure de début (ex: "14:00")

    @Column({ type: 'time', nullable: true })
    endTime: string; // Heure de fin (ex: "18:00")

    @Column({ nullable: true })
    location: string; // Lieu de l'événement

    @Column({ type: 'int', nullable: true })
    maxParticipants: number; // Nombre maximum de participants

    @ManyToOne(() => Admin, (admin) => admin.events)
    admin: Admin;

    @ManyToOne(() => Category, { nullable: true })
    category: Category; // Une seule catégorie par événement

    @ManyToMany(() => Company)
    @JoinTable()
    companies: Company[]; // Companies participant à l'événement

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
