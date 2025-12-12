import { HrFirstClub } from './HrFirstClub';
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, AfterLoad, AfterUpdate, ManyToOne, JoinColumn } from 'typeorm';
import bcrypt from 'bcrypt';

import { Admin } from './Admin';
import { Referral } from './Referral';
import { Freelance } from './Freelance';
import { Consultant } from './Consultant';
import { Company } from './Company';
import { Talent } from './Talent';
import { Role } from './Role';
import { Media } from './Media';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        unique: true,
    })
    email: string;

    @Column({ select: false })
    password: string;

    @Column({
        nullable: true,
    })
    firstname: string;

    @Column({
        nullable: true,
    })
    lastname: string;

    @Column({
        type: 'date',
        default: null,
    })
    validateAt: Date;

    @CreateDateColumn()
    createdAt: Date; // Creation date

    @UpdateDateColumn()
    updatedAt: Date; // Last updated date

    @OneToOne(() => Admin, (admin) => admin.user, { onDelete: 'CASCADE' })
    admin: Admin;

    @OneToOne(() => Referral, (referral) => referral.user, { onDelete: 'CASCADE' })
    referral: Referral;

    @OneToOne(() => HrFirstClub, (hrFirstClub) => hrFirstClub.user, { onDelete: 'CASCADE' })
    hrFirstClub: HrFirstClub;

    @OneToOne(() => Company, (company) => company.user, { onDelete: 'CASCADE' })
    company: Company;

    @OneToOne(() => Talent, (talent) => talent.user, { onDelete: 'CASCADE' })
    talent: Talent;

    @OneToOne(() => Freelance, (freelance) => freelance.user, { onDelete: 'CASCADE' })
    freelance: Freelance;

    @OneToOne(() => Consultant, (consultant) => consultant.user, { onDelete: 'CASCADE' })
    consultant: Consultant;

    @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    profilePicture: Media;

    @Column({ type: 'varchar', nullable: true })
    stripeCustomerId: string | null;

    @Column({ type: 'varchar', nullable: true })
    stripeSubscriptionId: string | null;

    @Column({ type: 'varchar', nullable: true })
    stripePriceId: string | null;

    @Column({ type: 'varchar', nullable: true })
    subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null;

    @Column({ type: 'varchar', nullable: true })
    googleId: string | null;

    async checkPasswd(passwd: string): Promise<boolean> {
        return await bcrypt.compare(passwd, this.password);
    }

    @AfterLoad()
    private loadTempPassword(): void {
        this.tempPassword = this.password;
    }

    private tempPassword: string;

    @BeforeUpdate()
    private async updatePassword(): Promise<void> {
        if (this.tempPassword !== this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    @BeforeInsert()
    private async hashPassword(): Promise<void> {
        this.password = await bcrypt.hash(this.password, 10);
    }

    async setPasswd(password: string) {
        this.password = password;
    }

    name: string;
    roles: Role[];
    isVerified: boolean;

    @AfterUpdate()
    @AfterLoad()
    private async setComputed() {
        this.name = `${this.firstname ? this.firstname : ''}${this.lastname ? ' ' + this.lastname : ''}`;
        this.roles = [];

        const relations = await Promise.all([
            Admin.createQueryBuilder('admin').leftJoinAndSelect('admin.role', 'role').where('userId = :userId', { userId: this.id }).getOne(),
            Company.createQueryBuilder('company').leftJoinAndSelect('company.role', 'role').where('userId = :userId', { userId: this.id }).getOne(),
            Talent.createQueryBuilder('talent').leftJoinAndSelect('talent.role', 'role').where('userId = :userId', { userId: this.id }).getOne(),
            Freelance.createQueryBuilder('freelance').leftJoinAndSelect('freelance.role', 'role').where('userId = :userId', { userId: this.id }).getOne(),
            Consultant.createQueryBuilder('consultant').leftJoinAndSelect('consultant.role', 'role').where('userId = :userId', { userId: this.id }).getOne(),
            Referral.createQueryBuilder('referral').leftJoinAndSelect('referral.role', 'role').where('userId = :userId', { userId: this.id }).getOne(),
            HrFirstClub.createQueryBuilder('hr_first_club').leftJoinAndSelect('hr_first_club.role', 'role').where('userId = :userId', { userId: this.id }).getOne(),
            //
        ]);

        for (const relation of relations) {
            if (relation && relation.role) {
                this.roles.push(relation.role);
            }
        }

        this.isVerified = this.validateAt && new Date(this.validateAt) <= new Date() ? true : false;
    }
}
