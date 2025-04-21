import { BeforeInsert, BeforeUpdate, BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ACTIVE_STATUS, Media } from '.';

@Entity()
export class Ad extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    slug: string;

    @Column({
        type: 'enum',
        enum: ACTIVE_STATUS,
        default: ACTIVE_STATUS.DISABLE,
    })
    status: ACTIVE_STATUS;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    image: Media;

    @Column({ nullable: true })
    link: string;

    @CreateDateColumn()
    createdAt: Date; // Creation date

    @BeforeUpdate()
    @BeforeInsert()
    private async removeActive() {
        if (this.status === ACTIVE_STATUS.ENABLE) {
            const activeAds = await Ad.find({ where: { status: ACTIVE_STATUS.ENABLE } });

            for (const ad of activeAds) {
                ad.status = ACTIVE_STATUS.DISABLE;
                await ad.save();
            }
        }
    }
}
