import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { STATUS } from './Status';

@Entity()
export class Testimonial {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text' })
    comment: string;

    @Column({ nullable: true })
    jobPosition?: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
