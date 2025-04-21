import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Role, User, Contact, Media } from '.';
import { STATUS } from './Status';

@Entity()
export class HrFirstClub extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Role)
    role: Role;

    @OneToOne(() => User, (user) => user.referral, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user: User;

    @Column({ nullable: false })
    companyName: string;

    @Column({ nullable: false })
    function: string;

    @Column({ nullable: false })
    membershipReason: string;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    logo: Media;

    @Column({
        type: 'enum',
        enum: STATUS,
        default: STATUS.PUBLIC,
    })
    status: STATUS;

    @OneToOne(() => Contact, { onDelete: 'CASCADE' })
    @JoinColumn()
    contact: Contact;

    @BeforeInsert()
    @BeforeUpdate()
    async setDefaultRole() {
        if (!this.role) {
            const role = (await Role.findOne({ where: { name: 'hr-first-club' } })) as Role;
            this.role = role;
        }
    }

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
