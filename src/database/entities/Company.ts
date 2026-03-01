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

    // Champs de base
    @Column({ type: 'varchar', length: '255', nullable: true })
    slogan: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    about: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    headquarters: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    website: string;

    @Column({ type: 'json', nullable: true })
    socialNetworks: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
    };

    // Champs de dates
    @Column({ type: 'date', nullable: true })
    foundedDate: Date;

    @Column({ type: 'date', nullable: true })
    creationDate: Date;

    @Column({ type: 'int', nullable: true })
    foundedYear: number;

    // Champs de taille/employés
    @Column({ type: 'varchar', length: '50', nullable: true })
    employeeCount: string;

    @Column({ type: 'int', nullable: true })
    numberOfEmployees: number;

    @Column({ type: 'varchar', length: '100', nullable: true })
    companySize: string;

    // Champs de localisation
    @Column({ type: 'varchar', length: '255', nullable: true })
    country: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    city: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    address: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    postalCode: string;

    // Champs de contact (en plus de la relation Contact)
    @Column({ type: 'varchar', length: '255', nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    email: string;

    // Champs secteur/industrie
    @Column({ type: 'varchar', length: '255', nullable: true })
    industry: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    sector: string;

    @Column({ type: 'text', nullable: true })
    companyDescription: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    companyStatus: string;

    // Champs de recrutement
    @Column({ type: 'text', nullable: true })
    profileSought: string;

    @Column({ type: 'varchar', length: '500', nullable: true })
    positionsToFill: string;

    @Column({ type: 'varchar', length: '500', nullable: true })
    requiredSkills: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    requiredExperience: string;

    @Column({ type: 'text', nullable: true })
    contractTypes: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    workingHours: string;

    @CreateDateColumn()
    createdAt: Date;
}
