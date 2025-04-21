import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { RoleName } from '../../type';

@Entity()
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: RoleName;

    @Column()
    title: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
