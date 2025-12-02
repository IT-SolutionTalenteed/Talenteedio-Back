import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Talent, Freelance, Consultant } from '.';

@Entity()
export class LM extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    content: string;

    @ManyToOne(() => Talent, (talent) => talent.lms, { onDelete: 'CASCADE', nullable: true })
    talent: Talent;

    @ManyToOne(() => Freelance, (freelance) => freelance.lms, { onDelete: 'CASCADE', nullable: true })
    freelance: Freelance;

    @ManyToOne(() => Consultant, (consultant) => consultant.lms, { onDelete: 'CASCADE', nullable: true })
    consultant: Consultant;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
