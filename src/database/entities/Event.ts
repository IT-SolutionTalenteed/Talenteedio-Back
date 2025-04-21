import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn } from 'typeorm';
import { Admin, Category } from '.';

enum STATUS {
    PUBLIC = 'public',
    DRAFT = 'draft',
    BLOCKED = 'blocked',
    IN_REVIEW = 'in_review',
}

@Entity()
export class Event extends BaseEntity {
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

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @Column({ type: 'date' })
    date: Date;

    @ManyToOne(() => Admin, (admin) => admin.events)
    admin: Admin;

    @ManyToMany(() => Category)
    @JoinTable()
    categories: Category[];

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
