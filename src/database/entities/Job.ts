import { BaseEntity, Column, CreateDateColumn, UpdateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { STATUS } from './Status';
import { Media, Location, JobType, Category, Company, Skill, Application, Value, Referred } from '.';

export enum HOURTYPE {
    PER_DAY = 'day',
    PER_WEEK = 'week',
    PER_MONTH = 'month',
    PER_YEAR = 'year',
}

export enum GENDER {
    FR = 'M/F/X',
    EN = 'M/W/D',
}

export enum SALARYTYPE {
    HOURLY = 'hourly',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

@Entity()
export class Job extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'text', nullable: true })
    metaDescription: string;

    @Column({ type: 'date' })
    expirationDate: Date;

    @Column({ nullable: true })
    hours: number;

    @Column({ type: 'enum', enum: HOURTYPE })
    hourType: HOURTYPE;

    @Column({ type: 'enum', enum: GENDER, nullable: true })
    gender: GENDER;

    @Column({ nullable: true })
    salaryMin: number;

    @Column({ nullable: true })
    salaryMax: number;

    @Column({ type: 'enum', enum: SALARYTYPE, nullable: true })
    salaryType: SALARYTYPE;

    @Column({ nullable: true })
    experience: number;

    @Column({ nullable: true })
    recruitmentNumber: number;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @Column({ type: 'boolean', default: false })
    isFeatured: boolean;

    @Column({ type: 'boolean', default: false })
    isUrgent: boolean;

    @Column({ type: 'boolean', default: false })
    isSharable: boolean;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    featuredImage: Media;

    @ManyToOne(() => Location)
    location: Location;

    @ManyToOne(() => JobType)
    jobType: JobType;

    @ManyToOne(() => Category)
    category: Category;

    @ManyToOne(() => Company, { nullable: false })
    company!: Company;

    @ManyToMany(() => Skill)
    @JoinTable()
    skills: Skill[];

    @ManyToMany(() => Value)
    @JoinTable()
    values: Value[];

    @OneToMany(() => Application, (application) => application.job)
    applications?: Application[];

    @OneToMany(() => Referred, (referred) => referred.job)
    reffereds?: Referred[];

    @CreateDateColumn()
    createdAt: Date; // Creation date

    @UpdateDateColumn()
    updatedAt: Date;
}
