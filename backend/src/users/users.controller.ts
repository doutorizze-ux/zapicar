
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { PlansService } from '../plans/plans.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly vehiclesService: VehiclesService,
        private readonly plansService: PlansService
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        if (user) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(@Request() req, @Body() body: { storeName?: string; phone?: string; slug?: string; primaryColor?: string; address?: string; storeDescription?: string }) {
        const updates: any = {};
        if (body.storeName !== undefined) updates.storeName = body.storeName;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.slug !== undefined) updates.slug = body.slug;
        if (body.primaryColor !== undefined) updates.primaryColor = body.primaryColor;
        if (body.address !== undefined) updates.address = body.address;
        if (body.storeDescription !== undefined) updates.storeDescription = body.storeDescription;

        return this.usersService.updateById(req.user.userId, updates);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logo')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads';
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `logo-${randomName}${extname(file.originalname)}`);
            }
        }),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB for logo
        }
    }))
    async uploadLogo(@Request() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new Error('File not found');
        const logoUrl = `/uploads/${file.filename}`;
        return this.usersService.updateById(req.user.userId, { logoUrl });
    }

    @UseGuards(JwtAuthGuard)
    @Post('cover')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads';
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `cover-${randomName}${extname(file.originalname)}`);
            }
        }),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB for cover
        }
    }))
    async uploadCover(@Request() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new Error('File not found');
        const coverUrl = `/uploads/${file.filename}`;
        return this.usersService.updateById(req.user.userId, { coverUrl });
    }

    @Get('public/:slug')
    async getPublicStore(@Param('slug') slug: string) {
        const user = await this.usersService.findBySlug(slug);
        if (!user) throw new Error('Store not found');

        let allowSite = false;
        if (user.planId) {
            const plan = await this.plansService.findOne(user.planId);
            if (plan && plan.isActive) {
                const features = Array.isArray(plan.features) ? plan.features : [];
                if (features.some(f => f.trim().includes('Site Personalizado'))) allowSite = true;
            }
        }

        if (!allowSite) throw new Error('Store website not active for this plan.');

        const vehicles = await this.vehiclesService.findAll(user.id);

        return {
            store: {
                name: user.storeName,
                logoUrl: user.logoUrl,
                coverUrl: user.coverUrl,
                phone: user.phone,
                primaryColor: user.primaryColor || '#000000',
                email: user.email,
                address: user.address,
                description: user.storeDescription,
            },
            vehicles: vehicles
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('export-site')
    async exportSite(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) throw new Error('User not found');
        return { html: this.usersService.generateStaticSite(user) };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() body: any) {
        if (body.password) {
            const salt = await bcrypt.genSalt();
            body.passwordHash = await bcrypt.hash(body.password, salt);
            delete body.password;
        }
        return this.usersService.updateById(id, body);
    }

    @Post('force-reset-admin')
    async forceReset() {
        return this.usersService.seedAdmin(true);
    }
}
