import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Role, User, Category, Contact, Application, Value, CV, LM } from '.';
import { STATUS } from './Status';

export enum WORKMODE {
    REMOTE = 'remote',
    HYBRID = 'hybrid',
    ONSITE = 'onsite',
}

@Entity()
export class Freelance extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Role)
    role: Role;

    @OneToOne(() => User, (user) => user.freelance, {
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

    @OneToMany(() => Application, (application) => application.freelance)
    applications?: Application[];

    @OneToMany(() => CV, (cv) => cv.freelance)
    cvs: CV[];

    @OneToMany(() => LM, (lm) => lm.freelance)
    lms: LM[];

    // Nouveaux champs
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    tjm: number;

    @Column({ nullable: true })
    mobility: string;

    @Column({ type: 'date', nullable: true })
    availabilityDate: Date;

    @Column({ nullable: true })
    desiredLocation: string;

    @Column({ type: 'enum', enum: WORKMODE, nullable: true })
    workMode: WORKMODE;

    @BeforeInsert()
    @BeforeUpdate()
    async setDefaultRole() {
        if (!this.role) {
            const role = (await Role.findOne({ where: { name: 'freelance' } })) as Role;
            this.role = role;
        }
    }

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
