import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum VehicleCategory {
    NEW = 'Novo',
    USED = 'Seminovo',
}

@Entity()
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    brand: string;

    @Column()
    model: string;

    @Column()
    year: number;

    @Column()
    km: number;

    @Column()
    fuel: string;

    @Column()
    transmission: string;

    @Column()
    color: string;

    @Column('text')
    description: string;

    @Column({
        type: 'simple-enum',
        enum: VehicleCategory,
        default: VehicleCategory.USED
    })
    category: VehicleCategory;

    @Column('decimal', { precision: 12, scale: 2 })
    price: number;

    @Column()
    location: string;

    @Column('simple-json', { nullable: true })
    images: string[];

    @ManyToOne(() => Store)
    store: Store;

    @Column({ nullable: true })
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
