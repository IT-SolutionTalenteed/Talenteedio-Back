import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Referral } from './Referral';
import { Job } from './Job';

@Entity()
export class Referred extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    talentEmail: string;

    @Column()
    talentFullName: string;

    @Column({ nullable: true })
    talentNumber?: string;

    @Column()
    jobReferenceLink: string;

    @ManyToOne(() => Referral)
    referral: Referral;

    @ManyToOne(() => Job)
    job: Job;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
