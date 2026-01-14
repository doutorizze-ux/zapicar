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

    @Column('decimal', { precision: 12, scale: 2, nullable: true, default: 0 })
    costPrice: number; // For Profit Calculation

    @Column()
    location: string;

    @Column('simple-json', { nullable: true })
    images: string[];

    @Column('simple-json', { nullable: true })
    documents: { name: string; url: string; type: string; date: string }[];

    @Column({ default: false })
    trava: boolean;

    @Column({ default: false })
    alarme: boolean;

    @Column({ default: false })
    som: boolean;

    @Column({ default: false })
    teto: boolean;

    @Column({ default: false })
    banco_couro: boolean;

    // --- New Optionals ---
    @Column({ nullable: true })
    ar_condicionado: string; // Manual, Digital (automático)

    @Column({ nullable: true })
    bancos_premium: string; // Couro, Outros materiais premium

    @Column({ nullable: true })
    teto_solar: string; // Elétrico, Panorâmico

    @Column({ default: false })
    vidros_eletricos: boolean;

    @Column({ default: false })
    chave_presencial: boolean;

    @Column({ nullable: true })
    retrovisores_eletricos: string; // Com rebatimento elétrico

    @Column({ nullable: true })
    multimidia: string; // GPS integrado, Espelhamento de celular

    @Column({ nullable: true })
    sensores_estacionamento: string; // Dianteiros, Traseiros, Dianteiros e Traseiros

    @Column({ nullable: true })
    camera_re: string; // Sim, 360°

    @Column({ nullable: true })
    som_premium: string; // Sim, Subwoofer

    @Column({ default: false })
    airbags_extra: boolean;

    @Column({ default: false })
    controle_tracao: boolean;

    @Column({ default: false })
    assistente_rampa: boolean;

    @Column({ nullable: true })
    farois: string; // LED, Xenônio

    @Column({ default: false })
    rodas_liga: boolean;

    @Column({ nullable: true })
    pintura: string; // Metálica, Perolizada

    @Column({ default: false })
    aerofolio: boolean;

    @Column({ default: false })
    frisos_laterais: boolean;


    @Column({ default: 0 })
    views: number;

    @Column({ default: 0 })
    interestCount: number;

    @ManyToOne(() => Store)
    store: Store;

    @Column({ nullable: true })
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
