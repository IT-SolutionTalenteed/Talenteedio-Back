import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Media } from './Media';
import { Category } from './Category';

export enum MatchingProfileStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

@Entity()
export class MatchingProfile extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    cv: Media;

    @Column({ type: 'text', nullable: true })
    cvText: string; // Texte extrait du CV pour le matching

    @Column({ type: 'simple-array', nullable: true })
    interests: string[]; // Centres d'intérêt

    @Column({ type: 'simple-array', nullable: true })
    skills: string[]; // Compétences

    @ManyToOne(() => Category, { nullable: true })
    @JoinColumn()
    currentSector: Category; // Secteur d'activité actuel

    @Column({ type: 'simple-array', nullable: true })
    targetSectorIds: string[]; // Secteurs qui intéressent (IDs de Category)

    @Column({
        type: 'enum',
        enum: MatchingProfileStatus,
        default: MatchingProfileStatus.DRAFT,
    })
    status: MatchingProfileStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
