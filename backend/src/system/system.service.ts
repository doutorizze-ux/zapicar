
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';

@Injectable()
export class SystemService implements OnModuleInit {
    constructor(
        @InjectRepository(SystemSettings)
        private settingsRepository: Repository<SystemSettings>,
    ) { }

    async onModuleInit() {
        const settings = await this.settingsRepository.findOne({ where: { id: 1 } });
        if (!settings) {
            await this.settingsRepository.save({
                id: 1,
                siteName: 'Zapicar',
                siteLogo: '/uploads/system-logo-default.png',
                primaryColor: '#25D366'
            });
        }
    }

    async getSettings() {
        return this.settingsRepository.findOne({ where: { id: 1 } });
    }

    async updateSettings(data: Partial<SystemSettings>) {
        await this.settingsRepository.update(1, data);
        return this.getSettings();
    }
}
