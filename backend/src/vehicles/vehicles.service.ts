import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle)
        private vehiclesRepository: Repository<Vehicle>,
        private usersService: UsersService,
        private plansService: PlansService,
    ) { }

    async create(createVehicleDto: CreateVehicleDto, userId?: string) {
        if (userId) {
            const user = await this.usersService.findById(userId);
            if (user && user.planId) {
                const plan = await this.plansService.findOne(user.planId);

                // If plan has a limit (not null/undefined/0), check it
                if (plan && plan.vehicleLimit !== null && plan.vehicleLimit !== undefined) {
                    const currentCount = await this.vehiclesRepository.count({ where: { userId } });

                    // If limit is 0, it might mean unlimited or blocked. Assuming 0 is unlimited or handled elsewhere?
                    // Usually 0 means 'None', -1 or null means 'Unlimited'.
                    // User request said: "value x can put only 10 vehicles... value x can put unlimited".
                    // Let's assume strict limit > 0. If limit is 0, we might want to block or treat as unlimited.
                    // Given the context, usually limit=null is unlimited.
                    // If explicit number, it is the limit.

                    if (plan.vehicleLimit > 0 && currentCount >= plan.vehicleLimit) {
                        throw new BadRequestException(`Limite de veículos do plano ${plan.name} atingido (${plan.vehicleLimit} veículos). Faça um upgrade para adicionar mais.`);
                    }
                }
            }
        }

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
