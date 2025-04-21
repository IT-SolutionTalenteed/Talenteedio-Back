import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { STATUS } from './Status';
import { Address } from './Address';

@Entity()
export class Location extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @ManyToOne(() => Address, { onDelete: 'CASCADE' })
    address: Address;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
