import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Talent } from '.';

@Entity()
export class LM extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    content: string;

    @ManyToOne(() => Talent, (talent) => talent.lms, { onDelete: 'CASCADE' })
    talent: Talent;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
