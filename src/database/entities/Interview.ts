import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Admin } from '.';

enum STATUS {
    PUBLIC = 'public',
    DRAFT = 'draft',
    BLOCKED = 'blocked',
    IN_REVIEW = 'in_review',
    PENDING = 'pending',
}

@Entity()
export class Interview extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'text', nullable: true })
    metaDescription: string;

    @Column()
    videoSrc: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @Column({ type: 'json' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    guests: any;

    @Column({ type: 'date' })
    date: Date;

    @ManyToOne(() => Admin, (admin) => admin.events)
    admin: Admin;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
