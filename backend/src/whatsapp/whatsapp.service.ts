import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { VehiclesService } from '../vehicles/vehicles.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';

import { LeadsService } from '../leads/leads.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
    // ...
    // Map<userId, Client>
    private clients: Map<string, Client> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService
    ) { }

    onModuleInit() {
        this.initializeAI();
        // We do NOT initialize a single client anymore. 
        // Clients are initialized on demand (when user visits the dashboard).
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
                args: ['--no-sandbox', '--disable-setuid-sandbox']
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
            this.clients.delete(userId); // Cleanup
        });

        client.on('message', async (message: Message) => {
            // Pass the userId so we know WHICH store's vehicles to search
            await this.handleMessage(message, userId);
        });

        try {
            await client.initialize();
        } catch (e) {
            console.error(`Failed to initialize client for ${userId}`, e);
        }
    }

    private async handleMessage(message: Message, userId: string) {
        const msg = message.body.toLowerCase();

        try {
            const contact = await message.getContact();
            await this.leadsService.upsert(userId, message.from, message.body, contact.pushname || contact.name);
        } catch (e) {
            console.error('Error tracking lead', e);
        }

        // 1. Get User Context
        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "ZapCar";

        // 2. Prepare Context (Smarter Search)
        const allVehicles = await this.vehiclesService.findAll(userId);
        let contextVehicles: any[] = [];

        // Ignora mensagens muito curtas ou genéricas para busca de veículos
        const ignoreTerms = ['bom', 'boa', 'tarde', 'noite', 'dia', 'ola', 'olá', 'tudo', 'bem', 'sim', 'não', 'quero'];
        const isGeneric = ignoreTerms.includes(msg) || msg.length <= 3;

        if (!isGeneric) {
            contextVehicles = allVehicles.filter(v => {
                const searchTerms = [v.name, v.brand, v.model].map(t => t?.toLowerCase() || '');
                // Verifica palavra exata ou inclusão significativa
                return searchTerms.some(term => term && msg.includes(term));
            }).slice(0, 5);
        }

        // Helper to delay (prevent spam blocking)
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        let shouldShowCars = false;
        let responseText = '';

        // 3. Fallback Logic Helper (Quando sem IA ou erro)
        const fallbackResponse = async (): Promise<string> => {
            const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];

            // Se for saudação e não achou carro específico
            if (greetings.some(g => msg.includes(g)) && contextVehicles.length === 0) {
                shouldShowCars = false;
                return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver nossas novidades!`;
            }

            if (msg.includes('endereço') || msg.includes('local') || msg.includes('onde fica')) {
                shouldShowCars = false;
                return `📍 Estamos localizados em: [Endereço da Loja].\nVenha nos visitar!`;
            }

            // aggressive keyword search success
            if (contextVehicles.length > 0) {
                shouldShowCars = true;
                return `Encontrei ${contextVehicles.length} opção(ões) que podem te interessar! 🚘\n\nVou te mandar as fotos e detalhes agora:`;
            }

            // Explicit stock request
            if (msg.includes('estoque') || msg.includes('catalogo') || msg.includes('catálogo')) {
                contextVehicles = allVehicles.slice(0, 5); // Show first 5 mixed
                shouldShowCars = true;
                return `Claro! Aqui estão alguns destaques do nosso estoque atual:`;
            }

            shouldShowCars = false;
            return `Desculpe, não entendi bem. 😕\n\nPor favor, diga o **nome do carro** que procura (ex: *Gol*, *Corolla*) ou digite *Estoque* para ver tudo.`;
        };

        // 4. Try FAQ Match First
        const faqMatch = await this.faqService.findMatch(userId, msg);

        if (faqMatch) {
            responseText = faqMatch;
            shouldShowCars = false;
        } else if (this.model) {
            try {
                // Enrich context for AI
                const params = contextVehicles.map(v =>
                    `- ${v.brand} ${v.name} ${v.model} (${v.year})`
                ).join('\n');

                const prompt = `
                Você é um vendedor experiente e simpático da loja "${storeName}".
                
                Mensagem do Cliente: "${message.body}"
                
                Veículos em estoque que correspondem à mensagem (pode estar vazio):
                ${params}
                
                Seu objetivo é:
                1. Analisar a intenção do cliente.
                2. Responder de forma natural e engajadora.
                
                Regras de Resposta:
                - Se o cliente apenas cumprimentou (Oi, Olá), responda cordialmente e pergunte o que ele busca. NÃO invente ofertas.
                - Se o cliente pediu um carro e ele ESTÁ na lista acima, diga que temos e que vai mostrar os detalhes.
                - Se o cliente pediu um carro e ele NÃO está na lista, diga que infelizmente não tem esse modelo exato no momento, mas pergunte se ele aceita ver outras opções.
                - Se o cliente perguntou endereço/telefone, responda se souber (ou diga pra consultar a bio).
                
                CONTROLE DE FLUXO (Crucial):
                No FINAL da sua resposta, adicione uma destas flags (invisíveis para o usuário final, eu vou remover depois):
                [SHOW_CARS] -> Use APENAS se você confirmou que temos o carro que o cliente pediu e vai mostrá-lo, ou se o cliente pediu para ver o estoque.
                [NO_CARS] -> Use em todos os outros casos (saudações, perguntas gerais, carro indisponível).
                `;

                const result = await this.model.generateContent(prompt);
                const aiResponse = result.response.text();

                // Parse AI decision
                if (aiResponse.includes('[SHOW_CARS]')) {
                    shouldShowCars = true;
                } else {
                    shouldShowCars = false;
                }

                // Remove flags from text sent to user
                responseText = aiResponse.replace(/\[SHOW_CARS\]|\[NO_CARS\]/g, '').trim();

            } catch (error) {
                console.error('AI Failed, using fallback strategy', error);
                responseText = await fallbackResponse();
            }
        } else {
            responseText = await fallbackResponse();
        }

        // 5. Reply with Text
        await message.reply(responseText);

        // 6. Send Cars (Card + Images) Only if decided
        const client = this.clients.get(userId);
        if (!client || !shouldShowCars) return; // Stop here if no cars to show

        // If AI said SHOW_CARS but context is empty (maybe user asked for generic 'estoque'), fill with featured
        let vehiclesToShow = contextVehicles;
        if (vehiclesToShow.length === 0) {
            // Pick rand or top 3 if context was empty but we want to show cars (e.g. asked for Stock)
            vehiclesToShow = allVehicles.slice(0, 3);
        }

        if (vehiclesToShow.length > 0) {
            for (const car of vehiclesToShow.slice(0, 5)) {
                // A. Send Specs Text
                const specs = `🔹 *${car.brand} ${car.name}* ${car.model || ''}
📅 Ano: ${car.year} | 🚦 Km: ${car.km || 'N/A'}
⛽ Combustível: ${car.fuel} | ⚙️ Câmbio: ${car.transmission}
🎨 Cor: ${car.color}
💰 *R$ ${Number(car.price).toLocaleString('pt-BR')}*

_Gostou deste? Digite_ *"Quero o ${car.name} ${car.year}"*`;

                await client.sendMessage(message.from, specs);
                await delay(800);

                // B. Send Images
                if (car.images && car.images.length > 0) {
                    const imagesToSend = car.images.slice(0, 4);

                    for (const imageUrl of imagesToSend) {
                        try {
                            if (!imageUrl) continue;

                            let finalUrl = imageUrl;
                            if (imageUrl.startsWith('/')) {
                                const port = process.env.PORT || 3000;
                                finalUrl = `http://localhost:${port}${imageUrl}`;
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
            }
        }
    }
}
