
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SystemSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 'Zapicar' })
    siteName: string;

    @Column({ nullable: true })
    siteLogo: string;

    @Column({ nullable: true })
    favicon: string;

    @Column({ nullable: true })
    primaryColor: string;
}
