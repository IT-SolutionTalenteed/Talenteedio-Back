import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Application } from '.';

export enum REVIEWER_TYPE {
    ADMIN = 'ADMIN',
    CLIENT = 'CLIENT',
}

@Entity()
export class ApplicationFeedback extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Application, { nullable: false, onDelete: 'CASCADE' })
    application: Application;

    @Column()
    reviewedBy: string;

    @Column({
        type: 'enum',
        enum: REVIEWER_TYPE,
    })
    reviewerType: REVIEWER_TYPE;

    @Column({ type: 'int', nullable: true })
    matchScoreAccuracy: number;

    @Column({ type: 'text', nullable: true })
    comments: string;

    @Column({ type: 'json', nullable: true })
    criteriaFeedback: any;

    @Column({ type: 'boolean', default: false })
    wasHired: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
