import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Contact, Media } from '.';

@Entity()
export class Setting extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Contact, { onDelete: 'CASCADE' })
    @JoinColumn()
    contact: Contact;

    @Column({ type: 'text', nullable: true })
    terms: string;

    @Column({ type: 'text', nullable: true })
    confidentiality: string;

    @Column({ type: 'text', nullable: true })
    didYouKnow: string;

    @Column({ type: 'text', nullable: true })
    gateway: string;

    @Column({ type: 'text', nullable: true })
    voice: string;

    @Column({ type: 'text', nullable: true })
    initiative: string;

    @Column({ nullable: true })
    headerText: string;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    homeImage1: Media;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    homeImage2: Media;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    homeImage3: Media;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
