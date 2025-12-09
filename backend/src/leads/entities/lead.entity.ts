import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum LeadStatus {
    NEW = 'NEW',
    CONTACTED = 'CONTACTED',
    NEGOTIATING = 'NEGOTIATING',
    WON = 'WON',
    LOST = 'LOST'
}

@Entity()
export class Lead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    storeId: string; // The user (store owner) ID

    @Column()
    phone: string;

    @Column({ nullable: true })
    name: string;

    @Column('text')
    lastMessage: string;

    @Column({
        type: 'enum',
        enum: LeadStatus,
        default: LeadStatus.NEW
    })
    status: LeadStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
