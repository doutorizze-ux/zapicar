
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PlanInterval {
    MONTHLY = 'MONTHLY',
    QUARTERLY = 'QUARTERLY',
    SEMIANNUALLY = 'SEMIANNUALLY',
    YEARLY = 'YEARLY',
}

@Entity()
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ nullable: true, default: 10 })
    vehicleLimit: number; // Max vehicles allowed, null/0 could mean unlimited if preferred, but explicit number is safer. Using null for unlimited logic is common.


    @Column({
        type: 'simple-enum',
        enum: PlanInterval,
        default: PlanInterval.MONTHLY,
    })
    interval: PlanInterval;

    @Column('simple-json', { nullable: true })
    features: string[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
