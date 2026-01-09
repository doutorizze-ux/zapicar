import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(Lead)
        private leadsRepository: Repository<Lead>,
        private vehiclesService: VehiclesService,
    ) { }

    async create(storeId: string, dto: any) {
        return this.upsert(storeId, dto.phone, dto.description || 'Lead Manual', dto.name);
    }

    async upsert(storeId: string, phone: string, message: string, name?: string) {
        let lead = await this.leadsRepository.findOne({ where: { storeId, phone } });

        if (!lead) {
            lead = this.leadsRepository.create({
                storeId,
                phone,
                name,
                lastMessage: message,
                isHot: this.checkHotLead(message),
                interestSubject: undefined
            });
        } else {
            lead.lastMessage = message;
            const isHotNow = this.checkHotLead(message);
            if (isHotNow) lead.isHot = true; // Only upgrade to hot, never downgrade automatically
            if (name) lead.name = name;
        }

        return this.leadsRepository.save(lead);
    }

    private checkHotLead(message: string): boolean {
        const keywords = ["price", "financing", "installments", "entrada", "parcelas", "trade-in", "troca", "how much", "valor"];
        const lower = message.toLowerCase();
        return keywords.some(k => lower.includes(k));
    }

    async setInterest(storeId: string, phone: string, interest: string) {
        const lead = await this.leadsRepository.findOne({ where: { storeId, phone } });
        if (lead) {
            lead.interestSubject = interest;
            return this.leadsRepository.save(lead);
        }
        return null;
    }

    async getCRMStats(storeId: string) {
        const leads = await this.leadsRepository.find({ where: { storeId } });
        const vehicles = await this.vehiclesService.findAll(storeId);

        const wonLeads = leads.filter(l => l.status === 'WON');
        const conversionRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0;

        // Calcular volume financeiro (Soma dos preços dos carros nos leads ativos)
        const openLeads = leads.filter(l => ['NEW', 'IN_PROGRESS', 'WAITING_FINANCIAL'].includes(l.status));
        let openValue = 0;

        openLeads.forEach(lead => {
            if (lead.interestSubject) {
                const vehicle = vehicles.find(v =>
                    lead.interestSubject.toLowerCase().includes(v.name.toLowerCase()) ||
                    lead.interestSubject.toLowerCase().includes(v.model.toLowerCase())
                );
                if (vehicle) openValue += Number(vehicle.price);
            }
        });

        const wonValue = wonLeads.reduce((acc, lead) => {
            if (lead.interestSubject) {
                const vehicle = vehicles.find(v =>
                    lead.interestSubject.toLowerCase().includes(v.name.toLowerCase()) ||
                    lead.interestSubject.toLowerCase().includes(v.model.toLowerCase())
                );
                if (vehicle) return acc + Number(vehicle.price);
            }
            return acc;
        }, 0);

        return {
            totalLeads: leads.length,
            conversionRate: conversionRate.toFixed(1),
            openValue,
            wonValue,
            hotLeads: leads.filter(l => l.isHot).length,
            recentLeads: leads.slice(0, 5)
        };
    }

    async getStats(storeId: string) {
        return this.getCRMStats(storeId);
    }

    async findAll(storeId: string): Promise<Lead[]> {
        return this.leadsRepository.find({
            where: { storeId },
            order: { updatedAt: 'DESC' }
        });
    }

    async updateStatus(id: string, storeId: string, status: string) {
        const lead = await this.leadsRepository.findOne({ where: { id, storeId } });
        if (lead) {
            lead.status = status;
            return this.leadsRepository.save(lead);
        }
        return null;
    }

    async remove(id: string, storeId: string) {
        const lead = await this.leadsRepository.findOne({ where: { id, storeId } });
        if (lead) {
            return this.leadsRepository.remove(lead);
        }
        return null;
    }
}
