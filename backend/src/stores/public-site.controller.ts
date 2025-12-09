import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';

@Controller('public')
export class PublicSiteController {
    constructor(
        private usersService: UsersService,
        private vehiclesService: VehiclesService
    ) { }

    @Get('store/:slug')
    async getStoreData(@Param('slug') slug: string) {
        const user = await this.usersService.findBySlugPublic(slug);
        if (!user) {
            throw new NotFoundException('Store not found');
        }

        const vehicles = await this.vehiclesService.findAll(user.id);

        return {
            store: {
                id: user.id,
                name: user.storeName,
                logoUrl: user.logoUrl,
                phone: user.phone,
                email: user.email // optional
            },
            vehicles: vehicles
        };
    }
}
