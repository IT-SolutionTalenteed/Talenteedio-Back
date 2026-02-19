import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Job, Talent, Consultant, Referral, CV, LM, ProfileMatchResult } from '.';

export enum APPLICATION_STATUS {
    INREVIEW = 'in_review',
    PENDING_REVIEW = 'pending_review',
    AUTO_SENT_TO_CLIENT = 'auto_sent_to_client',
    AWAITING_CONTRACT = 'awaiting_contract',
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

    @ManyToOne(() => Consultant, (consultant) => consultant.applications, { nullable: true })
    consultant: Consultant;

    @ManyToOne(() => CV)
    cv: CV;

    @ManyToOne(() => LM)
    lm: LM;

    @ManyToOne(() => ProfileMatchResult, { nullable: true })
    profileMatchResult: ProfileMatchResult;

    @Column({
        type: 'enum',
        enum: APPLICATION_STATUS,
        default: APPLICATION_STATUS.INREVIEW,
    })
    status: APPLICATION_STATUS;

    @Column({ nullable: true, type: 'text' })
    referral_recomandation: string;

    @Column({ type: 'int', nullable: true })
    matchScore: number;

    @Column({ type: 'enum', enum: ['AUTO', 'MANUAL'], default: 'MANUAL' })
    processingType: string;

    @Column({ type: 'text', nullable: true })
    rejectionReason: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
