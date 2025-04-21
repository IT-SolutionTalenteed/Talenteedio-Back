import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Job, Talent, Referral, CV, LM } from '.';

export enum APPLICATION_STATUS {
    INREVIEW = 'in_review',
    VALIDATED = 'validated',
    DENIED = 'denied',
    SELECTED = 'selected',
    HIRED = 'hired',
}

@Entity()
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Job, (job) => job.applications, { nullable: false, onDelete: 'CASCADE' })
    job: Job;

    @ManyToOne(() => Talent, (talent) => talent.applications, { nullable: false, onDelete: 'CASCADE' })
    talent: Talent;

    @ManyToOne(() => Referral, (referral) => referral.applications, { nullable: true })
    referral: Referral;

    @ManyToOne(() => CV)
    cv: CV;

    @ManyToOne(() => LM)
    lm: LM;

    @Column({
        type: 'enum',
        enum: APPLICATION_STATUS,
        default: APPLICATION_STATUS.INREVIEW,
    })
    status: APPLICATION_STATUS;

    @Column({ nullable: true, type: 'text' })
    referral_recomandation: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
