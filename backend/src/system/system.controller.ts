
import { Controller, Get, Patch, Body, UseGuards, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('system')
export class SystemController {
    constructor(private readonly systemService: SystemService) { }

    @Get('settings')
    async getSettings() {
        return this.systemService.getSettings();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch('settings')
    async updateSettings(@Body() body: any) {
        return this.systemService.updateSettings(body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('settings/logo')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `system-logo-${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadLogo(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new Error('File not found');
        const logoUrl = `/uploads/${file.filename}`;
        return this.systemService.updateSettings({ siteLogo: logoUrl });
    }
}
