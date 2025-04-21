import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Company } from '.';

@Entity()
export class Permission extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    title: string;

    @Column()
    numberOfJobsPerYear: number;

    @Column()
    numberOfArticlesPerYear: number;

    @Column()
    validityPeriodOfAJob: number;

    @OneToMany(() => Company, (company) => company.permission)
    companies: Company[];

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
