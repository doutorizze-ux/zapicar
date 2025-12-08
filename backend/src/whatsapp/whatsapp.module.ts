import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WhatsappController } from './whatsapp.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [VehiclesModule, UsersModule],
    providers: [WhatsappService],
    exports: [WhatsappService],
    controllers: [WhatsappController],
})
export class WhatsappModule { }
