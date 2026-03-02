import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

export enum NEWSLETTER_STATUS {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    SENDING = 'sending',
    SENT = 'sent',
    FAILED = 'failed',
}

export enum NEWSLETTER_RECIPIENT_TYPE {
    ALL_COMPANIES = 'all_companies',
    ALL_TALENTS = 'all_talents',
    ALL_CONSULTANTS = 'all_consultants',
    TALENTS_WITH_ACTIVE_APPOINTMENTS = 'talents_with_active_appointments',
    TALENTS_WITHOUT_APPOINTMENTS = 'talents_without_appointments',
    TALENTS_WITH_RECENT_APPLICATIONS = 'talents_with_recent_applications',
    TALENTS_WITHOUT_APPLICATIONS = 'talents_without_applications',
    COMPANIES_WITH_ACTIVE_JOBS = 'companies_with_active_jobs',
    COMPANIES_WITHOUT_JOBS = 'companies_without_jobs',
    VERIFIED_USERS = 'verified_users',
    UNVERIFIED_USERS = 'unverified_users',
    CUSTOM = 'custom',
}

@Entity()
export class Newsletter extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 500 })
    subject: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'text', nullable: true })
    htmlMessage: string;

    @Column({
        type: 'enum',
        enum: NEWSLETTER_STATUS,
        default: NEWSLETTER_STATUS.DRAFT,
    })
    status: NEWSLETTER_STATUS;

    @Column({ type: 'simple-array' })
    recipientTypes: NEWSLETTER_RECIPIENT_TYPE[];

    @Column({ type: 'simple-array', nullable: true })
    customRecipientEmails: string[];

    @Column({ type: 'simple-json', nullable: true })
    attachments: Array<{
        filename: string;
        path: string;
        contentType: string;
    }>;

    @Column({ type: 'int', default: 0 })
    totalRecipients: number;

    @Column({ type: 'int', default: 0 })
    sentCount: number;

    @Column({ type: 'int', default: 0 })
    failedCount: number;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date;

    @ManyToOne(() => User, { nullable: false })
    createdBy: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
