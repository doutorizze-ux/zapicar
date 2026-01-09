
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SystemSettings])],
    providers: [SystemService],
    controllers: [SystemController],
    exports: [SystemService],
})
export class SystemModule { }
