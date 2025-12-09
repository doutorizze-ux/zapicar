import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Get()
    findAll(@Request() req) {
        return this.leadsService.findAll(req.user.userId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Request() req) {
        return this.leadsService.update(id, updateLeadDto, req.user.userId);
    }
}
