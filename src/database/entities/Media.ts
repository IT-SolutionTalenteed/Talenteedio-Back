import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Media extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    fileUrl: string;

    @Column()
    fileType: string;

    @Column()
    fileName: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
