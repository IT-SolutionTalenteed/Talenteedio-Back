import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Address } from './Address';

@Entity()
export class Contact extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    email: string;

    @Column()
    phoneNumber: string;

    @OneToOne(() => Address, { onDelete: 'CASCADE' })
    @JoinColumn()
    address: Address;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
