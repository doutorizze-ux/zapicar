import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle)
        private vehiclesRepository: Repository<Vehicle>,
    ) { }

    create(createVehicleDto: CreateVehicleDto, userId?: string) {
        return this.vehiclesRepository.save({ ...createVehicleDto, userId });
    }

    findAll(userId?: string) {
        if (userId) {
            return this.vehiclesRepository.find({ where: { userId } });
        }
        return this.vehiclesRepository.find();
    }

    findOne(id: string) {
        return this.vehiclesRepository.findOne({ where: { id } });
    }

    update(id: string, updateVehicleDto: UpdateVehicleDto) {
        return this.vehiclesRepository.update(id, updateVehicleDto);
    }

    remove(id: string) {
        return this.vehiclesRepository.delete(id);
    }
}
