import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Application, CV } from '.';

export enum RECIPIENT_TYPE {
    CLIENT = 'CLIENT',
    ADMIN = 'ADMIN',
    CONSULTANT = 'CONSULTANT',
}

export enum TRANSMISSION_METHOD {
    EMAIL = 'EMAIL',
    DOWNLOAD = 'DOWNLOAD',
    API = 'API',
}

@Entity()
export class CVTransmissionLog extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Application, { nullable: false, onDelete: 'CASCADE' })
    application: Application;

    @ManyToOne(() => CV, { nullable: false, onDelete: 'CASCADE' })
    cv: CV;

    @Column()
    recipientEmail: string;

    @Column({
        type: 'enum',
        enum: RECIPIENT_TYPE,
    })
    recipientType: RECIPIENT_TYPE;

    @Column({
        type: 'enum',
        enum: TRANSMISSION_METHOD,
    })
    transmissionMethod: TRANSMISSION_METHOD;

    @Column({ type: 'boolean', default: false })
    hasWatermark: boolean;

    @Column({ nullable: true })
    watermarkText: string;

    @Column({ type: 'json', nullable: true })
    metadata: any;

    @CreateDateColumn()
    transmittedAt: Date;
}
