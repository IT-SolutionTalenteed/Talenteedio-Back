import { Entity, BaseEntity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

import { STATUS } from '.';

export enum MODEL {
    COMPANY = 'Company',
    REFERRAL = 'Referral',
    JOB = 'Job',
    TALENT = 'Talent',
    CONSULTANT = 'Consultant',
    JOB_TALENT = 'Job_Talent',
    ARTICLE = 'Article',
    EVENT = 'Event',
}

@Entity()
@Unique(['slug', 'model'])
export class Category extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    slug: string;

    @Column({ nullable: true })
    subtitle: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    image: string;

    @Column({ type: 'json', nullable: true })
    faq: { question: string; answer: string }[];

    @Column({ type: 'json', nullable: true })
    gallery: string[]; // Galerie d'images

    @Column({ type: 'json', nullable: true })
    testimonials: { avatar: string; fullname: string; job: string; avis: string }[];

    @Column({ nullable: true })
    video: string; // URL de la vidéo

    @Column({ type: 'json', nullable: true })
    detailList: string[]; // Liste de détails pour checklist

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @Column({
        type: 'enum',
        enum: MODEL,
    })
    model: MODEL;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
