import { VehicleCategory } from '../entities/vehicle.entity';

export class CreateVehicleDto {
    name: string;
    brand: string;
    model: string;
    year: number;
    km: number;
    fuel: string;
    transmission: string;
    color: string;
    description: string;
    category: VehicleCategory;
    price: number;
    location: string;
    images: string[];
    trava?: boolean;
    alarme?: boolean;
    som?: boolean;
    teto?: boolean;
    banco_couro?: boolean;
    ar_condicionado?: string;
    bancos_premium?: string;
    teto_solar?: string;
    vidros_eletricos?: boolean;
    chave_presencial?: boolean;
    retrovisores_eletricos?: string;
    multimidia?: string;
    sensores_estacionamento?: string;
    camera_re?: string;
    som_premium?: string;
    airbags_extra?: boolean;
    controle_tracao?: boolean;
    assistente_rampa?: boolean;
    farois?: string;
    rodas_liga?: boolean;
    pintura?: string;
    aerofolio?: boolean;
    frisos_laterais?: boolean;
    documents?: { name: string; url: string; type: string; date: string }[];
}

