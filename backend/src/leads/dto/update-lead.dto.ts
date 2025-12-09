import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '../entities/lead.entity';

export class UpdateLeadDto {
    @IsOptional()
    @IsEnum(LeadStatus)
    status?: LeadStatus;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    name?: string;
}
