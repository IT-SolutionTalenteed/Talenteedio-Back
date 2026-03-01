import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Role, Category, User, Contact, Skill, Application, CV, LM, Media, Value } from '.';
import { STATUS } from './Status';

export enum GENDER {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export enum EDUCATIONLEVEL {
    CERTIFICATE = 'certificate',
    DIPLOMA = 'diploma',
    ASSOCIATE = 'associate',
    BACHELOR = 'bachelor',
    MASERT = 'master',
    PROFESSIONAL = 'professional',
}

export enum WORKMODE {
    REMOTE = 'remote',
    HYBRID = 'hybrid',
    ONSITE = 'onsite',
}

@Entity()
export class Talent extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Role)
    role: Role;

    @OneToOne(() => User, (user) => user.talent, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user: User;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'enum', enum: GENDER, nullable: true })
    gender: GENDER;

    @Column({ nullable: true })
    experience: number;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @Column({ type: 'enum', enum: EDUCATIONLEVEL, nullable: true })
    educationLevel: EDUCATIONLEVEL;

    @OneToOne(() => Contact, { onDelete: 'CASCADE' })
    @JoinColumn()
    contact: Contact;

    @ManyToOne(() => Category)
    category: Category;

    @ManyToMany(() => Value)
    @JoinTable()
    values: Value[];

    @ManyToMany(() => Skill)
    @JoinTable()
    skills: Skill[];

    @BeforeInsert()
    @BeforeUpdate()
    async setDefaultRole() {
        if (!this.role) {
            const role = (await Role.findOne({ where: { name: 'talent' } })) as Role;
            this.role = role;
        }
    }

    @OneToMany(() => Application, (application) => application.talent)
    applications?: Application[];

    @OneToMany(() => CV, (cv) => cv.talent)
    cvs: CV[];

    @OneToMany(() => LM, (lm) => lm.talent)
    lms: LM[];

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    consent: Media;

    // Nouveaux champs
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    tjm: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    annualSalary: number;

    @Column({ nullable: true })
    mobility: string;

    @Column({ type: 'date', nullable: true })
    availabilityDate: Date;

    @Column({ nullable: true })
    desiredLocation: string;

    @Column({ type: 'enum', enum: WORKMODE, nullable: true })
    workMode: WORKMODE;

    // Nouveaux champs étendus pour l'inscription
    @Column({ nullable: true })
    currentSalary: string;

    @Column({ type: 'text', nullable: true })
    skillsText: string;

    @Column({ nullable: true })
    languages: string;

    @Column({ type: 'text', nullable: true })
    educationText: string;

    @Column({ nullable: true })
    desiredSector: string;

    @Column({ type: 'text', nullable: true })
    interests: string;

    @Column({ nullable: true })
    desiredPosition: string;

    @Column({ nullable: true })
    desiredSalary: string;

    @Column({ nullable: true })
    availability: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    city: string;

    @Column({ type: 'int', nullable: true })
    yearsOfExperience: number;

    @Column({ type: 'text', nullable: true })
    competences: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    address: string;

    @Column({ type: 'varchar', length: '20', nullable: true })
    postalCode: string;

    @Column({ type: 'text', nullable: true })
    formations: string;

    @Column({ type: 'varchar', length: '100', nullable: true })
    salaryRange: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    desiredWorkLocation: string;

    @Column({ type: 'varchar', length: '100', nullable: true })
    desiredContractType: string;

    @Column({ type: 'varchar', length: '255', nullable: true })
    desiredCompanyType: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
