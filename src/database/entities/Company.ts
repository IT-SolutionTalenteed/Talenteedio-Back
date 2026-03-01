import { BaseEntity, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, OneToMany, Column, CreateDateColumn } from 'typeorm';

import { Role, User, Article, Contact, Media, Category, Job, Permission } from '.';
import { STATUS } from './Status';

@Entity()
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    company_name: string;

    @OneToOne(() => Contact, { onDelete: 'CASCADE' })
    @JoinColumn()
    contact: Contact;

    @ManyToOne(() => Role)
    role: Role;

    @OneToOne(() => User, (user) => user.company, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user: User;

    @OneToMany(() => Article, (article) => article.company)
    articles: Article[];

    @OneToMany(() => Job, (job) => job.company)
    jobs: Job[];

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    logo: Media;

    @ManyToOne(() => Category)
    category: Category;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @BeforeInsert()
    @BeforeUpdate()
    async setDefaultRole() {
        if (!this.role) {
            const role = (await Role.findOne({ where: { name: 'company' } })) as Role;
            this.role = role;
        }
    }

    @ManyToOne(() => Permission, (permission) => permission.companies, { nullable: false })
    permission: Permission;

    // Nouveaux champs étendus pour l'inscription
    @Column({ type: 'date', nullable: true })
    foundedDate: Date;

    @Column({ nullable: true })
    employeeCount: string;

    @Column({ type: 'text', nullable: true })
    profileSought: string;

    @Column({ nullable: true })
    positionsToFill: string;

    @Column({ nullable: true })
    requiredSkills: string;

    @Column({ nullable: true })
    requiredExperience: string;

    // Champs supplémentaires pour l'inscription complète
    @Column({ type: 'varchar', length: '100', nullable: true })
    companySize: string;

    @Column({ type: 'int', nullable: true })
    foundedYear: number;

    @Column({ type: 'text', nullable: true })
    companyDescription: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    website: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    sector: string;

    @Column({ type: 'varchar', length: '100', nullable: true })
    country: string;

    @Column({ type: 'varchar', length: '100', nullable: true })
    city: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    address: string;

    @Column({ type: 'varchar', length: '20', nullable: true })
    postalCode: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
