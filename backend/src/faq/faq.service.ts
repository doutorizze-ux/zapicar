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

        // Normalize function: remove accents, lowercase, and basic punctuation
        const normalize = (str: string) =>
            str.normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[?!!.,]/g, " ")
                .trim();

        const normalizedMsg = normalize(message);
        const msgWords = normalizedMsg.split(/\s+/).filter(w => w.length >= 3);

        // Helper for roots (first 4 chars for words > 4 chars)
        const getRoot = (word: string) => word.length > 4 ? word.substring(0, 4) : word;
        const msgRoots = msgWords.map(getRoot);

        let bestMatch: { answer: string, score: number } | null = null;

        for (const faq of faqs) {
            if (!faq.active) continue;

            // Support multiple questions separated by symbols
            const triggers = faq.question.split(/[,;|]/).map(t => normalize(t));

            for (const trigger of triggers) {
                // 1. Sentence contain match
                if (normalizedMsg.includes(trigger) || trigger.includes(normalizedMsg)) {
                    return faq.answer;
                }

                // 2. Fuzzy Keyword match
                const triggerWords = trigger.split(/\s+/).filter(w => w.length >= 3);
                if (triggerWords.length === 0) continue;

                let matchCount = 0;
                for (const tWord of triggerWords) {
                    const tRoot = getRoot(tWord);
                    if (msgWords.includes(tWord) || msgRoots.includes(tRoot) || normalizedMsg.includes(tRoot)) {
                        matchCount++;
                    }
                }

                const score = matchCount / triggerWords.length;
                if (score >= 0.5) {
                    if (!bestMatch || score > bestMatch.score) {
                        bestMatch = { answer: faq.answer, score };
                    }
                }
            }
        }

        return bestMatch ? bestMatch.answer : null;
    }
}
