import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Consultant } from './Consultant';

@Entity()
export class Pricing extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ nullable: true })
    unit: string; // 'hour', 'day', 'project', etc.

    @ManyToOne(() => Consultant, (consultant) => consultant.pricings, {
        onDelete: 'CASCADE',
    })
    consultant: Consultant;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
