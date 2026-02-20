import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';

@Injectable()
export class FaqService {
    constructor(
        @InjectRepository(Faq)
        private faqRepository: Repository<Faq>,
    ) { }

    create(userId: string, data: Partial<Faq>) {
        const faq = this.faqRepository.create({ ...data, userId });
        return this.faqRepository.save(faq);
    }

    findAll(userId: string) {
        return this.faqRepository.find({ where: { userId } });
    }

    async update(id: string, userId: string, data: Partial<Faq>) {
        await this.faqRepository.update({ id, userId }, data);
        return this.faqRepository.findOne({ where: { id } });
    }

    remove(id: string, userId: string) {
        return this.faqRepository.delete({ id, userId });
    }

    // New method for matching logic
    async findMatch(userId: string, message: string): Promise<string | null> {
        const faqs = await this.findAll(userId);

        // Normalize function: remove accents and lowercase
        const normalize = (str: string) =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const normalizedMsg = normalize(message);
        const msgTokens = normalizedMsg.split(/\s+/).filter(t => t.length > 2);

        let bestMatch: { answer: string, score: number } | null = null;

        for (const faq of faqs) {
            if (!faq.active) continue;

            const normalizedQuestion = normalize(faq.question);

            // 1. Exact contain match (after normalization)
            if (normalizedMsg.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedMsg)) {
                return faq.answer;
            }

            // 2. Keyword density match
            const questionTokens = normalizedQuestion.split(/\s+/).filter(t => t.length > 2);
            let matches = 0;

            for (const qToken of questionTokens) {
                if (normalizedMsg.includes(qToken)) matches++;
            }

            const score = matches / (questionTokens.length || 1);

            // If at least 60% of keywords match
            if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { answer: faq.answer, score };
            }
        }

        return bestMatch ? bestMatch.answer : null;
    }
}
