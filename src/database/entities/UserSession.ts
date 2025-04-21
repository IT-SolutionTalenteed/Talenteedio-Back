import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserSession extends BaseEntity implements BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    expiresAt: number;

    @Column('json')
    data: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
