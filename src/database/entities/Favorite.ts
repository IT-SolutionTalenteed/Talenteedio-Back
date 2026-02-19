import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './User';
import { Job } from './Job';

export enum FAVORITE_TYPE {
    JOB = 'job',
}

@Entity()
@Unique(['user', 'job'])
export class Favorite extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Job, { nullable: false, onDelete: 'CASCADE' })
    job: Job;

    @Column({
        type: 'enum',
        enum: FAVORITE_TYPE,
    })
    type: FAVORITE_TYPE;

    @CreateDateColumn()
    createdAt: Date;
}
