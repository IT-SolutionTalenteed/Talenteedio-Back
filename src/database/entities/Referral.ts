import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Role, User, Category, Contact, Application } from '.';
import { STATUS } from './Status';
import { Referred } from './Referred';

@Entity()
export class Referral extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Role)
    role: Role;

    @OneToOne(() => User, (user) => user.referral, {
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

    @OneToMany(() => Referred, (referred) => referred.referral)
    companies: Referred[];

    @OneToOne(() => Contact, { onDelete: 'CASCADE' })
    @JoinColumn()
    contact: Contact;

    @OneToMany(() => Application, (application) => application.referral)
    applications?: Application[];

    @BeforeInsert()
    @BeforeUpdate()
    async setDefaultRole() {
        if (!this.role) {
            const role = (await Role.findOne({ where: { name: 'referral' } })) as Role;
            this.role = role;
        }
    }

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
