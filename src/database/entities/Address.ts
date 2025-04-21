import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Address extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    line: string;

    @Column()
    postalCode: string;

    @Column()
    city: string;

    @Column({ nullable: true })
    state?: string;

    @Column()
    country: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
