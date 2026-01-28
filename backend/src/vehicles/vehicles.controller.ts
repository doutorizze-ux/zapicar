import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Query, UseGuards, Request } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createVehicleDto: CreateVehicleDto, @Request() req) {
        return this.vehiclesService.create(createVehicleDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/upload')
    @UseInterceptors(FilesInterceptor('files', 10, {
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
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        }),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB per file
        }
    }))
    async uploadImages(@Param('id') id: string, @UploadedFiles() files: Array<Express.Multer.File>) {
        if (!files || files.length === 0) throw new Error('No files found');

        const vehicle = await this.vehiclesService.findOne(id);
        if (!vehicle) {
            throw new Error('Vehicle not found');
        }
        if (!vehicle.images) vehicle.images = [];

        files.forEach(file => {
            const imageUrl = `/uploads/${file.filename}`;
            vehicle.images.push(imageUrl);
        });

        // Use direct repository save for better entity handling with simple-json
        return this.vehiclesService.update(id, { images: vehicle.images });
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/upload-doc')
    @UseInterceptors(FilesInterceptor('files', 10, {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/docs';
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        }),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB per file
        }
    }))
    async uploadDocuments(@Param('id') id: string, @UploadedFiles() files: Array<Express.Multer.File>) {
        // Ensure uploads/docs exists (In production code we'd check/create folder, but assuming it works or standard multer pattern)
        if (!files || files.length === 0) throw new Error('No files found');

        const vehicle = await this.vehiclesService.findOne(id);
        if (!vehicle) throw new Error('Vehicle not found');

        if (!vehicle.documents) vehicle.documents = [];

        files.forEach(file => {
            const docUrl = `/uploads/docs/${file.filename}`;
            vehicle.documents.push({
                name: file.originalname,
                url: docUrl,
                type: file.mimetype,
                date: new Date().toISOString()
            });
        });

        return this.vehiclesService.update(id, { documents: vehicle.documents });
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req) {
        return this.vehiclesService.findAll(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.vehiclesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
        return this.vehiclesService.update(id, updateVehicleDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.vehiclesService.remove(id);
    }
}
