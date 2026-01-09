
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private configService: ConfigService,
    ) { }

    generateStaticSite(user: User): string {
        const apiUrl = this.configService.get('API_URL') || 'https://zapp.fitness/api';
        const slug = user.slug || 'loja';

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.storeName || 'Loja de Veículos'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .bg-primary { background-color: ${user.primaryColor || '#25D366'}; }
        .text-primary { color: ${user.primaryColor || '#25D366'}; }
        .border-primary { border-color: ${user.primaryColor || '#25D366'}; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 scroll-smooth">

    <!-- Navbar -->
    <nav class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
            <div class="flex items-center gap-3">
                ${user.logoUrl ? `<img src="${user.logoUrl.startsWith('http') ? user.logoUrl : apiUrl + user.logoUrl}" class="h-10 w-auto object-contain" />` : `<div class="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xl">${user.storeName ? user.storeName[0] : 'S'}</div><span class="font-bold text-xl">${user.storeName || 'Loja'}</span>`}
            </div>
            <div class="hidden md:flex items-center gap-8 font-medium text-sm text-gray-500">
                <a href="#stock" class="hover:text-gray-900">Estoque</a>
                <a href="#about" class="hover:text-gray-900">Sobre</a>
                <a href="#footer" class="hover:text-gray-900">Contato</a>
                ${user.phone ? `<a href="https://wa.me/${user.phone.replace(/\D/g, '')}" target="_blank" class="px-5 py-2.5 bg-primary text-white rounded-full font-bold">Fale Conosco</a>` : ''}
            </div>
        </div>
    </nav>

    <!-- Hero -->
    <div class="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
        ${user.coverUrl ? `<img src="${user.coverUrl.startsWith('http') ? user.coverUrl : apiUrl + user.coverUrl}" class="absolute inset-0 w-full h-full object-cover" />` : `<div class="absolute inset-0 bg-primary opacity-20"></div>`}
        <div class="absolute inset-0 bg-black/40"></div>
        <div class="relative z-10 text-center px-4 max-w-3xl mx-auto text-white">
            <h1 class="text-4xl md:text-6xl font-black mb-6 drop-shadow-lg">${user.storeName || 'Bem-vindo'}</h1>
            <p class="text-lg md:text-xl font-medium opacity-90">${user.storeDescription || 'O seu próximo carro está aqui.'}</p>
        </div>
    </div>

    <!-- Main -->
    <main id="stock" class="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
                <h2 class="text-3xl font-bold">Nosso Estoque</h2>
                <p class="text-gray-500 mt-2">Confira nossos veículos disponíveis</p>
            </div>
            <div class="relative w-full md:w-96">
                <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"></i>
                <input type="text" id="searchInput" placeholder="Buscar carro..." class="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium">
            </div>
        </div>

        <!-- Grid -->
        <div id="vehicleGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div class="col-span-full py-20 text-center"><div class="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div></div>
        </div>
    </main>

    <!-- Modal -->
    <div id="vehicleModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
        <div class="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <button onclick="closeModal()" class="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white backdrop-blur-md">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <div id="modalImages" class="w-full md:w-3/5 bg-black relative flex items-center justify-center h-[40vh] md:h-auto"></div>
            <div id="modalContent" class="w-full md:w-2/5 p-6 md:p-8 bg-white overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-hide"></div>
        </div>
    </div>

    <!-- Footer -->
    <footer id="footer" class="bg-gray-900 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-12">
            <div class="max-w-xs">
                <h3 class="text-2xl font-bold mb-6">${user.storeName}</h3>
                <p class="text-gray-400 text-sm">Qualidade e confiança na compra do seu veículo.</p>
            </div>
            <div>
                <h4 class="font-bold mb-6 uppercase text-xs tracking-widest text-gray-500">Contato</h4>
                <div class="space-y-4 text-gray-400 text-sm">
                    ${user.phone ? `<p class="flex items-center gap-3"><i data-lucide="message-circle" class="w-5 h-5 text-green-500"></i> ${user.phone}</p>` : ''}
                    ${user.address ? `<p class="flex items-center gap-3"><i data-lucide="map-pin" class="w-5 h-5 text-red-500"></i> ${user.address}</p>` : ''}
                </div>
            </div>
        </div>
        <div class="max-w-7xl mx-auto border-t border-gray-800 mt-16 pt-8 text-center text-gray-500 text-xs">
             © <script>document.write(new Date().getFullYear())</script> ${user.storeName}. Tecnologia Zapicar.
        </div>
    </footer>

    <script>
        const API_URL = '${apiUrl}';
        const STORE_SLUG = '${slug}';
        let allVehicles = [];

        async function init() {
            try {
                const res = await fetch(\`\${API_URL}/users/public/\${STORE_SLUG}\`);
                const data = await res.json();
                allVehicles = data.vehicles;
                renderVehicles(allVehicles);
                lucide.createIcons();
            } catch (e) {
                console.error(e);
            }
        }

        function renderVehicles(list) {
            const grid = document.getElementById('vehicleGrid');
            grid.innerHTML = list.map(v => \`
                <div onclick="openModal('\${v.id}')" class="bg-white rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform shadow-sm hover:shadow-xl border border-gray-100 flex flex-col">
                    <div class="aspect-[4/3] relative bg-gray-200">
                        <img src="\${v.images && v.images[0] ? (v.images[0].startsWith('http') ? v.images[0] : API_URL + v.images[0]) : ''}" class="w-full h-full object-cover">
                        <div class="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold">\${v.year}</div>
                    </div>
                    <div class="p-6 flex-1 flex flex-col">
                        <p class="text-xs font-bold text-gray-400 uppercase mb-1">\${v.brand}</p>
                        <h3 class="text-xl font-bold text-gray-900 truncate">\${v.name}</h3>
                        <p class="text-sm text-gray-500 mb-4">\${v.model}</p>
                        <div class="flex items-center justify-between mt-auto">
                            <p class="text-2xl font-black text-primary">R$ \${Number(v.price).toLocaleString('pt-BR')}</p>
                            <div class="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center"><i data-lucide="chevron-right"></i></div>
                        </div>
                    </div>
                </div>
            \`).join('');
            lucide.createIcons();
        }

        document.getElementById('searchInput').addEventListener('input', e => {
            const term = e.target.value.toLowerCase();
            const filtered = allVehicles.filter(v => 
                v.name.toLowerCase().includes(term) || 
                v.brand.toLowerCase().includes(term) || 
                v.model.toLowerCase().includes(term)
            );
            renderVehicles(filtered);
        });

        function openModal(id) {
            const v = allVehicles.find(v => v.id === id);
            const modal = document.getElementById('vehicleModal');
            const imagesDiv = document.getElementById('modalImages');
            const contentDiv = document.getElementById('modalContent');

            imagesDiv.innerHTML = v.images.map((img, i) => \`
                <img src="\${img.startsWith('http') ? img : API_URL + img}" class="\${i === 0 ? '' : 'hidden'} w-full h-full object-contain" id="modalImg-\${i}">
            \`).join('');

            if (v.images.length > 1) {
                imagesDiv.innerHTML += \`
                    <button onclick="changeModalImg(-1, \${v.images.length}, event)" class="absolute left-4 p-2 rounded-full bg-white/20 text-white"><i data-lucide="chevron-left"></i></button>
                    <button onclick="changeModalImg(1, \${v.images.length}, event)" class="absolute right-4 p-2 rounded-full bg-white/20 text-white"><i data-lucide="chevron-right"></i></button>
                \`;
            }

            contentDiv.innerHTML = \`
                <div class="mb-6"><p class="text-sm font-bold text-gray-400 uppercase mb-1">\${v.brand}</p><h2 class="text-3xl font-bold text-gray-900">\${v.name}</h2></div>
                <p class="text-4xl font-black text-primary mb-8">R$ \${Number(v.price).toLocaleString('pt-BR')}</p>
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="bg-gray-50 p-4 rounded-xl text-center"><p class="text-xs text-gray-500 font-bold uppercase mb-1">Ano</p><p class="font-bold">\${v.year}</p></div>
                    <div class="bg-gray-50 p-4 rounded-xl text-center"><p class="text-xs text-gray-500 font-bold uppercase mb-1">KM</p><p class="font-bold">\${v.km ? v.km.toLocaleString() : '---'}</p></div>
                </div>
                <div class="mb-8 p-4 bg-gray-50 rounded-2xl"><p class="text-gray-600 text-sm leading-relaxed">\${v.description || 'Sem descrição.'}</p></div>
                <a href="https://wa.me/${user.phone ? user.phone.replace(/\D/g, '') : ''}?text=Olá! Segue o interesse no \${v.brand} \${v.name}" target="_blank" class="block w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-center">Tenho Interesse</a>
            \`;

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();
        }

        let currentModalIdx = 0;
        function changeModalImg(dir, total, e) {
            e.stopPropagation();
            document.getElementById(\`modalImg-\${currentModalIdx}\`).classList.add('hidden');
            currentModalIdx = (currentModalIdx + dir + total) % total;
            document.getElementById(\`modalImg-\${currentModalIdx}\`).classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('vehicleModal').classList.add('hidden');
            document.body.style.overflow = 'auto';
            currentModalIdx = 0;
        }

        init();
    </script>
</body>
</html>`;
    }

    async onModuleInit() {
        await this.seedAdmin();
    }

    async seedAdmin(force = false) {
        const adminEmail = 'admin@zapicar.com.br';
        const adminUser = await this.usersRepository.findOne({ where: { email: adminEmail } });

        if (!adminUser) {
            console.log('Seeding default admin user...');
            await this.create(adminEmail, 'Asd@080782', 'ZapCar Admin', UserRole.ADMIN);
        } else if (force) {
            console.log('Forcing Admin Password Reset...');
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash('admin', salt);
            await this.usersRepository.update({ email: adminEmail }, { passwordHash });
            return { success: true, message: 'Admin password reset to: admin' };
        }
    }

    async create(email: string, password: string, storeName?: string, role: UserRole = UserRole.STORE_OWNER, document?: string): Promise<User> {
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const user = this.usersRepository.create({
            email,
            passwordHash,
            storeName,
            role,
            document
        });

        return this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findOne(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async update(email: string, updateData: Partial<User>): Promise<User> {
        await this.usersRepository.update({ email }, updateData);
        const user = await this.findOne(email);
        if (!user) throw new Error('User not found');
        return user;
    }

    async updateById(id: string, updateData: Partial<User>): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }

        const updatedUser = this.usersRepository.merge(user, updateData);
        return this.usersRepository.save(updatedUser);
    }

    async findBySlug(slug: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { slug } });
    }
}
