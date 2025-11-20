import { BaseEntity, Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Job, CV } from '.';

@Entity()
@Index(['cvId', 'jobId'], { unique: true })
export class ProfileMatchResult extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    cvId: string;

    @ManyToOne(() => CV, { nullable: false, onDelete: 'CASCADE' })
    cv: CV;

    @Column()
    jobId: string;

    @ManyToOne(() => Job, { nullable: false, onDelete: 'CASCADE' })
    job: Job;

    @Column({ type: 'text' })
    cvText: string;

    @Column({ type: 'text' })
    jobText: string;

    @Column({ type: 'json' })
    pythonReturn: any;

    @CreateDateColumn()
    createdAt: Date;
}
