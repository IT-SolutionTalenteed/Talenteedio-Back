import { BaseEntity, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, JoinColumn, BeforeInsert, BeforeUpdate, OneToMany, CreateDateColumn } from 'typeorm';

import { Role } from './Role';
import { User } from './User';
import { Article } from './Article';
import { Event } from './Event';

@Entity()
export class Admin extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Role)
    role: Role;

    @OneToOne(() => User, (user) => user.admin, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user: User;

    @OneToMany(() => Article, (article) => article.admin)
    articles: Article[];

    @OneToMany(() => Event, (event) => event.admin)
    events: Event[];

    @BeforeInsert()
    @BeforeUpdate()
    async setDefaultRole() {
        if (!this.role) {
            const role = (await Role.findOne({ where: { name: 'admin' } })) as Role;
            this.role = role;
        }
    }

    @CreateDateColumn()
    createdAt: Date; // Creation date
}
