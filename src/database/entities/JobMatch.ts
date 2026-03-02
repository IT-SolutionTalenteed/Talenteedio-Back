import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MatchingProfile } from './MatchingProfile';
import { Job } from './Job';

@Entity()
export class JobMatch extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    matchingProfileId: string;

    @ManyToOne(() => MatchingProfile, { onDelete: 'CASCADE' })
    matchingProfile: MatchingProfile;

    @Column()
    jobId: string;

    @ManyToOne(() => Job, { onDelete: 'CASCADE' })
    job: Job;

    @Column({ type: 'float' })
    matchScore: number;

    @Column({ type: 'json', nullable: true })
    matchDetails: any;

    @Column({ type: 'boolean', default: false })
    isSelected: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
