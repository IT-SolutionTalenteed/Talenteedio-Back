import { Entity, BaseEntity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

import { STATUS } from '.';

export enum MODEL {
    COMPANY = 'Company',
    REFERRAL = 'Referral',
    JOB = 'Job',
    TALENT = 'Talent',
    JOB_TALENT = 'Job_Talent',
    ARTICLE = 'Article',
    EVENT = 'Event',
}

@Entity()
@Unique(['slug', 'model'])
export class Category extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    slug: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @Column({
        type: 'enum',
        enum: MODEL,
    })
    model: MODEL;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
