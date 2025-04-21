import { Column, Entity, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

import { STATUS } from './Status';

@Entity()
export class Value extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
