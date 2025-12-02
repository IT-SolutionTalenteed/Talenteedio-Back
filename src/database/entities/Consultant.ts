import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Role, User, Category, Contact, Application, Value, CV, LM } from '.';
import { STATUS } from './Status';

export enum WORKMODE {
    REMOTE = 'remote',
    HYBRID = 'hybrid',
    ONSITE = 'onsite',
}

@Entity()
export class Consultant extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Role)
    role: Role;

    @OneToOne(() => User, (user) => user.consultant, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user: User;

    @Column({ nullable: true })
    title: string;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @ManyToOne(() => Category)
    category: Category;

    @OneToOne(() => Contact, { onDelete: 'CASCADE' })
    @JoinColumn()
    contact: Contact;

    @ManyToMany(() => Value)
    @JoinTable()
    values: Value[];

    @OneToMany(() => Application, (application) => application.consultant)
    applications?: Application[];

    @OneToMany(() => CV, (cv) => cv.consultant)
    cvs: CV[];

    @OneToMany(() => LM, (lm) => lm.consultant)
    lms: LM[];

    // Champs spécifiques au consultant
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

    @Column({ nullable: true })
    expertise: string;

    @Column({ type: 'int', nullable: true })
    yearsOfExperience: number;

    @BeforeInsert()
    @BeforeUpdate()
    async setDefaultRole() {
        if (!this.role) {
            const role = (await Role.findOne({ where: { name: 'consultant' } })) as Role;
            this.role = role;
        }
    }

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
