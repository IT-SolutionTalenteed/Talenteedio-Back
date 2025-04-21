import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Media } from '.';

enum STATUS {
    PUBLIC = 'public',
    DRAFT = 'draft',
    BLOCKED = 'blocked',
    IN_REVIEW = 'in_review',
}

@Entity()
export class Partner extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    slug: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    image: Media;

    @Column({ nullable: true })
    link: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
