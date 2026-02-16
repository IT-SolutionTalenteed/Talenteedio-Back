import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { MatchingProfile } from './MatchingProfile';
import { Company } from './Company';

@Entity()
@Index(['matchingProfileId', 'companyId'], { unique: true })
export class CompanyMatch extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => MatchingProfile, { onDelete: 'CASCADE' })
    @JoinColumn()
    matchingProfile: MatchingProfile;

    @Column()
    matchingProfileId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn()
    company: Company;

    @Column()
    companyId: string;

    @Column({ type: 'float', default: 0 })
    matchScore: number; // Score de matching en pourcentage (0-100)

    @Column({ type: 'json', nullable: true })
    matchDetails: {
        overall_match_percentage: number;
        criteria_scores?: Array<{
            criterion: string;
            score: number;
            explanation: string;
        }>;
        strengths?: string[];
        gaps?: string[];
        recommendation?: string;
    };

    @Column({ type: 'boolean', default: false })
    isSelected: boolean; // L'utilisateur a sélectionné cette entreprise

    @CreateDateColumn()
    createdAt: Date;
}
