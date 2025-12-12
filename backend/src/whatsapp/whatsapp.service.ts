import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { VehiclesService } from '../vehicles/vehicles.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { ChatMessage } from './entities/chat-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';
import { LeadsService } from '../leads/leads.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class WhatsappService implements OnModuleInit {
    // Map<userId, Client>
    private clients: Map<string, Client> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();
    private pausedUsers: Set<string> = new Set(); // New: Memory-based pause state
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    setBotPaused(userId: string, paused: boolean) {
        if (paused) {
            this.pausedUsers.add(userId);
        } else {
            this.pausedUsers.delete(userId);
        }
        console.log(`Bot for user ${userId} is now ${paused ? 'PAUSED' : 'ACTIVE'}`);
    }

    isBotPaused(userId: string): boolean {
        return this.pausedUsers.has(userId);
    }

    constructor(
        @InjectRepository(ChatMessage)
        private chatRepository: Repository<ChatMessage>,
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService,
        private chatGateway: ChatGateway
    ) { }

    // Helper to log message
    private async logMessage(storeId: string, contactId: string, from: string, body: string, senderName: string, isBot: boolean) {
        try {
            await this.chatRepository.save({
                storeId,
                contactId,
                from,
                body,
                senderName,
                isBot
            });
        } catch (e) {
            console.error('Failed to log message', e);
        }
    }

    // Helper to fetch history
    async getChatHistory(storeId: string, contactId: string) {
        return this.chatRepository.find({
            where: { storeId, contactId },
            order: { createdAt: 'ASC' }
        });
    }

    async getRecentChats(storeId: string) {
        const rawChats = await this.chatRepository
            .createQueryBuilder("msg")
            .select("msg.contactId", "id")
            .addSelect("MAX(CASE WHEN msg.isBot = 0 AND msg.from != 'me' THEN msg.senderName ELSE NULL END)", "customerName")
            .addSelect("MAX(msg.createdAt)", "lastTime")
            .addSelect("MAX(CONCAT(msg.createdAt, '|||', msg.body))", "rawLastMessage")
            .where("msg.storeId = :storeId", { storeId })
            .groupBy("msg.contactId")
            .orderBy("lastTime", "DESC")
            .getRawMany();

        return rawChats.map(chat => {
            let body = '';
            if (chat.rawLastMessage) {
                const parts = chat.rawLastMessage.split('|||');
                if (parts.length >= 2) {
                    body = parts.slice(1).join('|||');
                } else {
                    body = chat.rawLastMessage;
                }
            }

            return {
                id: chat.id,
                name: chat.customerName || chat.id,
                lastTime: chat.lastTime,
                lastMessage: body
            };
        });
    }

    onModuleInit() {
        this.initializeAI();
        this.cleanSimulationData();
        this.restoreSessions();
    }

    private async cleanSimulationData() {
        try {
            await this.chatRepository.delete({ contactId: '5511999999999' });
            await this.chatRepository.delete({ contactId: '5511999999999@c.us' });
            console.log('Cleaned up simulation data artifacts.');
        } catch (e) {
            console.error('Failed to cleanup sim data', e);
        }
    }

    private async restoreSessions() {
        console.log('Restoring WhatsApp sessions...');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path');
        const authPath = path.join(process.cwd(), '.wwebjs_auth');

        if (fs.existsSync(authPath)) {
            const files = fs.readdirSync(authPath);
            for (const file of files) {
                if (file.startsWith('session-store-')) {
                    const userId = file.replace('session-store-', '');
                    if (userId && !userId.startsWith('session-') && !this.clients.has(userId)) {
                        console.log(`[Restore] Found session for user ${userId}, restoring...`);
                        this.initializeClient(userId);
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }
        } else {
            console.log('No existing sessions to restore.');
        }
    }

    private initializeAI() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        } else {
            console.warn('GEMINI_API_KEY not found. AI features disabled.');
        }
    }

    async getSession(userId: string) {
        if (!this.clients.has(userId)) {
            await this.initializeClient(userId);
        }

        return {
            status: this.statuses.get(userId) || 'DISCONNECTED',
            qr: this.qrCodes.get(userId) || null
        };
    }

    private async initializeClient(userId: string) {
        console.log(`Initializing WhatsApp Client for User: ${userId}`);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: `store-${userId}`
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        });

        this.clients.set(userId, client);
        this.statuses.set(userId, 'DISCONNECTED');

        client.on('qr', (qr) => {
            console.log(`QR RECEIVED caused by ${userId}`);
            this.qrCodes.set(userId, qr);
            this.statuses.set(userId, 'QR_READY');
        });

        client.on('ready', () => {
            console.log(`WhatsApp Client for ${userId} is ready!`);
            this.statuses.set(userId, 'CONNECTED');
            this.qrCodes.delete(userId);
        });

        client.on('disconnected', () => {
            console.log(`Client ${userId} disconnected`);
            this.statuses.set(userId, 'DISCONNECTED');
            this.qrCodes.delete(userId);
            this.clients.delete(userId);
        });

        client.on('message', async (message: Message) => {
            await this.handleMessage(message, userId);
        });

        try {
            await client.initialize();
        } catch (e) {
            console.error(`Failed to initialize client for ${userId}`, e);
        }
    }

    async sendManualMessage(userId: string, to: string, message: string) {
        let client = this.clients.get(userId);
        if (!client) {
            console.log(`Client for ${userId} not found during manual send. Attempting to restore...`);
            await this.initializeClient(userId);
            client = this.clients.get(userId);
            if (!client) {
                throw new Error('WhatsApp client could not be initialized');
            }
        }

        let chatId = to;
        if (!chatId.includes('@c.us')) {
            chatId = `${chatId.replace(/\D/g, '')}@c.us`;
        }

        try {
            await client.sendMessage(chatId, message);
        } catch (e) {
            console.error('Error sending message (client might not be ready yet):', e);
            throw new Error('Client not ready. Please wait a moment and try again.');
        }

        this.logMessage(userId, to, 'me', message, 'Atendente', true);

        this.chatGateway.emitMessageToRoom(userId, {
            id: 'manual-' + Date.now(),
            from: 'me',
            body: message,
            timestamp: Date.now() / 1000,
            senderName: 'Atendente',
            isBot: true
        });
    }

    // Normalize helper - removes accents and lowercases
    private normalize = (str: string) => {
        if (!str) return '';
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    private async handleMessage(message: Message, userId: string) {
        const cleanFrom = message.from.replace(/@c\.us|@g\.us/g, '');

        // 0. Emit Incoming Message to Live Chat
        try {
            const contact = await message.getContact();
            const contactName = contact.pushname || contact.name || cleanFrom;

            this.logMessage(userId, cleanFrom, cleanFrom, message.body, contactName, false);

            this.chatGateway.emitMessageToRoom(userId, {
                id: message.id.id,
                from: cleanFrom,
                body: message.body,
                timestamp: message.timestamp,
                senderName: contactName,
                isBot: false
            });
        } catch (e) { console.error('Error emitting socket msg', e); }

        const rawMsg = (message.body || '').toString();
        const msg = this.normalize(rawMsg);

        try {
            const contact = await message.getContact();
            await this.leadsService.upsert(userId, cleanFrom, message.body, contact.pushname || contact.name);
        } catch (e) {
            console.error('Error tracking lead', e);
        }

        if (this.isBotPaused(userId)) {
            console.log(`Bot paused for ${userId}, skipping auto-reply.`);
            return;
        }

        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || 'ZapCar';

        // Fetch vehicles once and normalize their searchable fields
        const allVehiclesRaw = await this.vehiclesService.findAll(userId) || [];
        const allVehicles = allVehiclesRaw.map(v => ({ ...v,
            _search: [v.name, v.brand, v.model, v.year?.toString()].map(s => this.normalize(s || ''))
        }));

        // Pre-check for fixed responses (fast path) - local cache of common intents
        const fixedResponses: Record<string, string> = {
            'oi': `Olá! 👋 Bem-vindo à *${storeName}*.

Sou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *estoque* para ver tudo.`,
            'ola': `Olá! 👋 Bem-vindo à *${storeName}*.

Sou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *estoque* para ver tudo.`,
            'tudo bem': `Tudo bem por aqui! Como posso ajudar você hoje?`,
            'estoque': `Claro! Aqui estão alguns destaques do nosso estoque atual:`
        };

        if (fixedResponses[msg]) {
            await message.reply(fixedResponses[msg]);
            this.logMessage(userId, message.from, 'bot', fixedResponses[msg], storeName + ' (Bot)', true);
            this.chatGateway.emitMessageToRoom(userId, {
                id: 'bot-' + Date.now(),
                from: 'bot',
                body: fixedResponses[msg],
                timestamp: Date.now() / 1000,
                senderName: storeName + ' (Bot)',
                isBot: true
            });
            return;
        }

        // 1. Try FAQ Match (existing behavior)
        const faqMatch = await this.faqService.findMatch(userId, msg);
        if (faqMatch) {
            await message.reply(faqMatch);
            this.logMessage(userId, message.from, 'bot', faqMatch, storeName + ' (Bot)', true);
            this.chatGateway.emitMessageToRoom(userId, {
                id: 'bot-' + Date.now(),
                from: 'bot',
                body: faqMatch,
                timestamp: Date.now() / 1000,
                senderName: storeName + ' (Bot)',
                isBot: true
            });
            return;
        }

        // 2. Strict local search before calling AI - more deterministic
        const strictMatchVehicles = allVehicles.filter(v => {
            return v._search.some(term => term && term.length > 2 && msg.includes(term));
        }).map(v => ({ ...v }));

        let contextVehicles = strictMatchVehicles;
        let shouldShowCars = false;
        let responseText = '';

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const fallbackResponse = async () => {
            if (strictMatchVehicles.length > 0) {
                contextVehicles = strictMatchVehicles;
                shouldShowCars = true;
                return `Encontrei ${strictMatchVehicles.length} opção(ões) que podem te interessar! 🚘\n\nVou te mandar as fotos e detalhes agora:`;
            }

            if (msg.includes('estoque') || msg.includes('catalogo') || msg.includes('catalogo')) {
                contextVehicles = allVehicles.slice(0, 5);
                shouldShowCars = true;
                return `Claro! Aqui estão alguns destaques do nosso estoque atual:`;
            }

            shouldShowCars = false;
            return `Poxa, procurei aqui e não encontrei nenhum carro com nome "${rawMsg}" no momento. 😕\n\nMas temos muitas outras opções! Digite *Estoque* para ver o que chegou.`;
        };

        // 3. AI path (only if we didn't already find strict match) - make AI deterministic and constrained
        if (this.model) {
            try {
                const aiContextVehicles = allVehicles.slice(0, 50);
                const params = aiContextVehicles.map(v => `- ${v.brand || ''} ${v.name || ''} ${v.model || ''} (${v.year || ''})`).join('\n');

                const systemPrompt = `Você é um assistente de vendas chamado ZappyBot para a loja ${storeName}.\nResponda APENAS com base no estoque fornecido abaixo.\nNão invente carros, preços ou imagens.\nResponda de forma concisa e objetiva.\nUse as flags [SHOW_CARS] ou [NO_CARS] ao final da mensagem para controlar exibição de veículos.`;

                const userPrompt = `Mensagem do cliente: "${rawMsg}"\n\nEstoque:\n${params || 'Nenhum carro no estoque.'}\n\nRegras:\n1) Se for saudação -> responda saudação e termine com [NO_CARS].\n2) Se pedir modelo existente -> responda "Tenho sim! ..." e termine com [SHOW_CARS].\n3) Se pedir catálogo/estoque -> responda com resumo e termine com [SHOW_CARS].\n4) Se não houver correspondência -> responda que não encontrou e termine com [NO_CARS].\nRetorne apenas a resposta seguida da flag.`;

                const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

                // generateContent options: pass low temperature for determinism if supported
                const result = await this.model.generateContent(fullPrompt, { temperature: 0.2, maxOutputTokens: 512 }).catch(e => { throw e; });

                const aiResponse = (result?.response?.text && typeof result.response.text === 'function') ? result.response.text() : (result?.response || '').toString();

                // Robust flag detection (remove whitespace, uppercase)
                const normalizedAI = aiResponse.replace(/\s/g, '').toUpperCase();
                shouldShowCars = normalizedAI.includes('[SHOW_CARS]');
                responseText = aiResponse.replace(/\[SHOW_CARS\]|\[NO_CARS\]/gi, '').trim();

                // If AI says SHOW_CARS but we have no strict context, attempt fuzzy local filter
                if (shouldShowCars && contextVehicles.length === 0) {
                    // try to find approximate matches by token
                    const tokens = msg.split(/\s+/).filter(t => t.length > 2);
                    const fuzzy = allVehicles.filter(v => v._search.some(term => tokens.some(tok => term.includes(tok))));
                    if (fuzzy.length > 0) contextVehicles = fuzzy.slice(0, 5);
                }

            } catch (error) {
                console.error('AI Failed, using fallback strategy', error);
                responseText = await fallbackResponse();
            }
        } else {
            responseText = await fallbackResponse();
        }

        // 4. Reply with Text
        try {
            await message.reply(responseText);
        } catch (e) {
            console.error('Failed to send reply text', e);
        }

        this.logMessage(userId, message.from, 'bot', responseText, storeName + ' (Bot)', true);
        this.chatGateway.emitMessageToRoom(userId, {
            id: 'bot-' + Date.now(),
            from: 'bot',
            body: responseText,
            timestamp: Date.now() / 1000,
            senderName: storeName + ' (Bot)',
            isBot: true
        });

        // 5. Send Cars (Card + Images) Only if decided
        const client = this.clients.get(userId);
        if (!client || !shouldShowCars) return; // IMPORTANT: Only send images if AI explicitly requested

        let vehiclesToShow = contextVehicles;
        if (vehiclesToShow.length === 0 && shouldShowCars) {
            vehiclesToShow = allVehicles.slice(0, 3);
        }

        if (vehiclesToShow.length > 0) {
            for (const car of vehiclesToShow.slice(0, 5)) {
                const features: string[] = [];
                if (car.trava) features.push('Trava');
                if (car.alarme) features.push('Alarme');
                if (car.som) features.push('Som');
                if (car.teto) features.push('Teto Solar');
                if (car.banco_couro) features.push('Banco de Couro');

                const featuresText = features.length > 0 ? `✨ Opcionais: ${features.join(', ')}\n` : '';

                const specs = `🔹 *${car.brand || ''} ${car.name || ''}* ${car.model || ''}\n📅 Ano: ${car.year || 'N/A'} | 🚦 Km: ${car.km || 'N/A'}\n⛽ Combustível: ${car.fuel || 'N/A'} | ⚙️ Câmbio: ${car.transmission || 'N/A'}\n🎨 Cor: ${car.color || 'N/A'}\n${featuresText}💰 *R$ ${Number(car.price || 0).toLocaleString('pt-BR')}*\n\n_Gostou deste? Digite_ *"Quero o ${car.name} ${car.year}"*`;

                try {
                    await client.sendMessage(message.from, specs);

                    this.chatGateway.emitMessageToRoom(userId, {
                        id: 'bot-car-' + car.id,
                        from: 'bot',
                        body: specs,
                        timestamp: Date.now() / 1000,
                        senderName: storeName + ' (Bot)',
                        isBot: true
                    });

                    this.logMessage(userId, message.from, 'bot', specs, storeName + ' (Bot)', true);

                    await delay(800);

                    if (car.images && car.images.length > 0) {
                        const imagesToSend = car.images.slice(0, 4);
                        for (const imageUrl of imagesToSend) {
                            try {
                                if (!imageUrl) continue;
                                let finalUrl = imageUrl;
                                if (imageUrl.startsWith('/')) {
                                    const base = this.configService.get('APP_URL') || `http://localhost:${process.env.PORT || 3000}`;
                                    finalUrl = `${base.replace(/\/$/, '')}${imageUrl}`;
                                }
                                if (finalUrl.startsWith('http')) {
                                    const media = await MessageMedia.fromUrl(finalUrl);
                                    await client.sendMessage(message.from, media);
                                    await delay(1000);
                                }
                            } catch (e) {
                                console.error(`Failed to send image for ${car.name}:`, e);
                            }
                        }
                    }

                    await delay(1500);
                    await client.sendMessage(message.from, '--------------------------------');
                    await delay(500);

                } catch (e) {
                    console.error('Failed to send car spec or images', e);
                }
            }
        }
    }
}
