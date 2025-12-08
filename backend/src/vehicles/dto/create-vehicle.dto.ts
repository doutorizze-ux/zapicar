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
}
