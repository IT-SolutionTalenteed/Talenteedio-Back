import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Talent, Consultant, Media } from '.';

@Entity()
export class CV extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'json', nullable: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    languages: any;

    @Column({ type: 'json', nullable: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diplomas: any;

    @Column({ type: 'json', nullable: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experiences: any;

    @Column({ type: 'json', nullable: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skills: any;

    @ManyToOne(() => Talent, (talent) => talent.cvs, { onDelete: 'CASCADE', nullable: true })
    talent: Talent;

    @ManyToOne(() => Consultant, (consultant) => consultant.cvs, { onDelete: 'CASCADE', nullable: true })
    consultant: Consultant;

    @ManyToOne(() => Media, { onDelete: 'CASCADE', nullable: true })
    file: Media;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
