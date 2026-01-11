
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
        const fileBaseUrl = apiUrl.replace('/api', '');
        const slug = user.slug || 'loja';

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title id="page-title">${user.storeName || 'Loja de Veículos'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root { --primary: ${user.primaryColor || '#25D366'}; }
        body { font-family: 'Inter', sans-serif; }
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
        .ring-primary { --tw-ring-color: var(--primary); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 scroll-smooth">

    <nav class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
            <div class="flex items-center gap-3" id="nav-logo">
                ${user.logoUrl ? `<img src="${user.logoUrl.startsWith('http') ? user.logoUrl : fileBaseUrl + user.logoUrl}" class="h-10 w-auto object-contain" />` : `<div class="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xl">${user.storeName ? user.storeName[0] : 'S'}</div><span class="font-bold text-xl">${user.storeName || 'Loja'}</span>`}
            </div>
            <div class="hidden md:flex items-center gap-8 font-medium text-sm text-gray-500">
                <a href="#stock" class="hover:text-gray-900">Estoque</a>
                <a href="#about" class="hover:text-gray-900">Sobre</a>
                <a href="#footer" class="hover:text-gray-900">Contato</a>
                <a id="header-whatsapp" href="https://wa.me/${user.phone ? user.phone.replace(/\D/g, '') : ''}" target="_blank" class="px-5 py-2.5 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">Fale Conosco</a>
            </div>
        </div>
    </nav>

    <div class="relative h-[40vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <img id="hero-bg" src="${user.coverUrl ? (user.coverUrl.startsWith('http') ? user.coverUrl : fileBaseUrl + user.coverUrl) : ''}" class="absolute inset-0 w-full h-full object-cover ${!user.coverUrl ? 'hidden' : ''}" />
        <div id="hero-fallback" class="absolute inset-0 bg-primary opacity-20 ${user.coverUrl ? 'hidden' : ''}"></div>
        <div class="absolute inset-0 bg-black/40"></div>
        <div class="relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
            <h1 id="hero-title" class="text-4xl md:text-7xl font-black mb-6 drop-shadow-2xl uppercase tracking-tighter">${user.storeName || 'Bem-vindo'}</h1>
            <p id="hero-desc" class="text-lg md:text-2xl font-medium opacity-90 drop-shadow-md italic">"${user.storeDescription || 'O seu próximo carro está aqui.'}"</p>
        </div>
    </div>

    <main id="stock" class="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div>
                <h2 class="text-4xl font-black text-gray-900 uppercase tracking-tighter">Nosso Estoque</h2>
                <div class="w-20 h-1.5 bg-primary mt-2 rounded-full"></div>
            </div>
            <div class="relative w-full md:w-[400px]">
                <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"></i>
                <input type="text" id="searchInput" placeholder="Qual carro você procura?" class="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium">
            </div>
        </div>

        <div id="vehicleGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div class="col-span-full py-32 text-center items-center justify-center flex flex-col gap-4">
                <div class="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando estoque atualizado...</p>
            </div>
        </div>
    </main>

    <footer id="footer" class="bg-gray-900 text-white py-20 px-4">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            <div class="space-y-6">
                <div class="flex items-center gap-3" id="footer-logo">
                    ${user.logoUrl ? `<img src="${user.logoUrl.startsWith('http') ? user.logoUrl : fileBaseUrl + user.logoUrl}" class="h-10 w-auto brightness-0 invert" />` : `<span class="text-2xl font-black uppercase tracking-tighter">${user.storeName}</span>`}
                </div>
                <p id="footer-desc" class="text-gray-400 text-sm leading-relaxed">${user.storeDescription || 'Especialistas em realizar sonhos sobre rodas.'}</p>
            </div>
            
            <div id="about">
                <h4 class="text-lg font-bold mb-6 flex items-center gap-2 text-primary">Sobre Nós</h4>
                <p id="footer-address" class="text-gray-400 text-sm leading-relaxed">${user.address ? `Localizados em: ${user.address}` : 'Tradição e confiança na venda de veículos selecionados.'}</p>
            </div>

            <div>
                <h3 class="text-lg font-bold mb-6 flex items-center gap-2 text-primary">Contato</h3>
                <div class="space-y-4" id="footer-contact">
                    ${user.phone ? `<a href="https://wa.me/${user.phone.replace(/\D/g, '')}" class="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"><i data-lucide="phone" class="w-5 h-5"></i> ${user.phone}</a>` : ''}
                    <div class="flex items-center gap-3 text-gray-400"><i data-lucide="map-pin" class="w-5 h-5"></i> ${user.address || 'Consulte nosso endereço'}</div>
                </div>
            </div>
        </div>
        <div class="max-w-7xl mx-auto border-t border-white/5 mt-16 pt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
             © <script>document.write(new Date().getFullYear())</script> <span id="copyright-name">${user.storeName}</span>. Tecnologia Zapicar.
        </div>
    </footer>

    <div id="vehicleModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
        <div class="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <button onclick="closeModal()" class="absolute top-6 right-6 z-50 bg-black/50 hover:bg-black p-2 rounded-full text-white backdrop-blur-md transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <div id="modalImages" class="w-full md:w-3/5 bg-black relative flex items-center justify-center h-[50vh] md:h-auto border-r border-gray-100"></div>
            <div id="modalContent" class="w-full md:w-2/5 p-8 md:p-12 bg-white overflow-y-auto scrollbar-hide flex flex-col"></div>
        </div>
    </div>

    <script>
        const API_URL = '${apiUrl}';
        const FILE_URL = '${fileBaseUrl}';
        const STORE_SLUG = '${slug}';
        let allVehicles = [];
        let storeData = null;

        async function init() {
            try {
                const res = await fetch(\`\${API_URL}/users/public/\${STORE_SLUG}\`);
                const data = await res.json();
                
                allVehicles = data.vehicles;
                storeData = data.store;

                updateStoreUI(storeData);
                renderVehicles(allVehicles);
                lucide.createIcons();
            } catch (e) {
                console.error('Erro de conexão:', e);
                document.getElementById('vehicleGrid').innerHTML = \`
                    <div class="col-span-full py-20 text-center space-y-4">
                        <p class="text-gray-400">Não foi possível carregar os dados dinâmicos devido a restrições do navegador (CORS).</p>
                        <p class="text-xs text-gray-500 bg-gray-100 p-4 rounded-xl inline-block max-w-md">Para o site se atualizar sozinho e mostrar os carros, você deve subi-lo para uma hospedagem real.</p>
                    </div>
                \`;
            }
        }

        function updateStoreUI(store) {
            if (store.primaryColor) {
                document.documentElement.style.setProperty('--primary', store.primaryColor);
            }
            document.title = store.name;
            document.getElementById('hero-title').innerText = store.name;
            document.getElementById('hero-desc').innerText = \`"\${store.description || ''}"\`;
            document.getElementById('footer-desc').innerText = store.description || '';
            document.getElementById('copyright-name').innerText = store.name;
            document.getElementById('footer-address').innerText = store.address ? \`Localizados em: \${store.address}\` : '';

            const getImg = (url) => url.startsWith('http') ? url : FILE_URL + url;
            
            if (store.logoUrl) {
                const logoHtml = \`<img src="\${getImg(store.logoUrl)}" class="h-10 w-auto object-contain" />\`;
                document.getElementById('nav-logo').innerHTML = logoHtml;
                document.getElementById('footer-logo').innerHTML = \`<img src="\${getImg(store.logoUrl)}" class="h-10 w-auto brightness-0 invert" />\`;
            }

            if (store.coverUrl) {
                document.getElementById('hero-bg').src = getImg(store.coverUrl);
                document.getElementById('hero-bg').classList.remove('hidden');
                document.getElementById('hero-fallback').classList.add('hidden');
            }

            if (store.phone) {
                const phoneClean = store.phone.replace(/\\D/g, '');
                const headerWa = document.getElementById('header-whatsapp');
                if (headerWa) headerWa.href = \`https://wa.me/\${phoneClean}\`;
                document.getElementById('footer-contact').innerHTML = \`
                    <a href="https://wa.me/\${phoneClean}" class="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"><i data-lucide="phone" class="w-5 h-5"></i> \${store.phone}</a>
                    <div class="flex items-center gap-3 text-gray-400"><i data-lucide="map-pin" class="w-5 h-5"></i> \${store.address || 'Consulte nosso endereço'}</div>
                \`;
                lucide.createIcons();
            }
        }

        function renderVehicles(list) {
            const grid = document.getElementById('vehicleGrid');
            if (list.length === 0) {
                grid.innerHTML = '<div class="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum veículo no estoque no momento.</div>';
                return;
            }
            grid.innerHTML = list.map(v => \`
                <div onclick=\"openModal('\${v.id}')\" class=\"group bg-white rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col\">
                    <div class=\"aspect-[4/3] relative bg-gray-100 overflow-hidden\">
                        <img src=\"\${v.images && v.images[0] ? (v.images[0].startsWith('http') ? v.images[0] : FILE_URL + v.images[0]) : ''}\" class=\"w-full h-full object-cover group-hover:scale-110 transition-transform duration-700\">
                        <div class=\"absolute top-4 right-4 bg-white/95 px-3 py-1 rounded-full text-[10px] font-black uppercase\">\${v.year}</div>
                    </div>
                    <div class=\"p-6 flex-1 flex flex-col\">
                        <p class=\"text-[10px] font-black text-primary uppercase mb-1 tracking-widest\">\${v.brand}</p>
                        <h3 class=\"text-xl font-bold text-gray-900 group-hover:text-primary transition-colors tracking-tighter\">\${v.name}</h3>
                        <p class=\"text-sm text-gray-500 mb-6 font-medium italic\">\${v.model}</p>
                        <div class=\"mt-auto pt-6 border-t border-gray-50 flex items-center justify-between\">
                            <div class=\"flex flex-col\">
                                <p class=\"text-[10px] text-gray-400 font-bold uppercase tracking-widest\">Valor</p>
                                <p class=\"text-2xl font-black text-gray-900\">R$ \${Number(v.price).toLocaleString('pt-BR')}</p>
                            </div>
                            <div class=\"w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center group-hover:bg-primary transition-colors duration-300\"><i data-lucide=\"chevron-right\" class=\"w-5 h-5\"></i></div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        document.getElementById('searchInput').addEventListener('input', e => {
            const term = e.target.value.toLowerCase();
            const filtered = allVehicles.filter(v => 
                v.name.toLowerCase().includes(term) || 
                v.brand.toLowerCase().includes(term) || 
                v.model.toLowerCase().includes(term)
            );
            renderVehicles(filtered);
            lucide.createIcons();
        });

        function openModal(id) {
            const v = allVehicles.find(v => v.id === id);
            const modal = document.getElementById('vehicleModal');
            const imagesDiv = document.getElementById('modalImages');
            const contentDiv = document.getElementById('modalContent');
            const phoneOwner = storeData ? storeData.phone.replace(/\\D/g, '') : '';

            imagesDiv.innerHTML = v.images.map((img, i) => \`
                <img src=\"\${img.startsWith('http') ? img : FILE_URL + img}\" class=\"\${i === 0 ? '' : 'hidden'} w-full h-full object-contain\" id=\"modalImg-\${i}\">
            \`).join('');

            if (v.images.length > 1) {
                imagesDiv.innerHTML += \`
                    <button onclick=\"changeModalImg(-1, \${v.images.length}, event)\" class=\"absolute left-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all\"><i data-lucide=\"chevron-left\"></i></button>
                    <button onclick=\"changeModalImg(1, \${v.images.length}, event)\" class=\"absolute right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all\"><i data-lucide=\"chevron-right\"></i></button>
                \`;
            }

            contentDiv.innerHTML = \`
                <div class=\"mb-8\">
                    <p class=\"text-xs font-black text-primary uppercase tracking-[0.2em] mb-2\">\${v.brand} • \${v.year}</p>
                    <h2 class=\"text-4xl font-black text-gray-900 uppercase tracking-tighter\">\${v.name}</h2>
                    <p class=\"text-lg text-gray-500 font-medium italic\">\${v.model}</p>
                </div>
                
                <p class=\"text-5xl font-black text-gray-900 mb-10 tracking-tighter\">R$ \${Number(v.price).toLocaleString('pt-BR')}</p>
                
                <div class=\"grid grid-cols-2 gap-4 mb-10\">
                    <div class=\"bg-gray-50 p-4 rounded-3xl border border-gray-100\"><p class=\"text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1\">Quilometragem</p><p class=\"text-xl font-black text-gray-900\">\${v.km ? v.km.toLocaleString() + ' km' : '---'}</p></div>
                    <div class=\"bg-gray-50 p-4 rounded-3xl border border-gray-100\"><p class=\"text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1\">Ano Modelo</p><p class=\"text-xl font-black text-gray-900\">\${v.year}</p></div>
                </div>

                <div class=\"mb-10 text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4\">
                    <i data-lucide=\"info\" class=\"w-4 h-4 text-primary\"></i> Descrição do especialista
                </div>
                <div class=\"mb-10 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 italic text-gray-600 font-medium leading-relaxed\">
                    \"\${v.description || 'Sem descrição detalhada.'}\"
                </div>

                <a href=\"https://wa.me/\${phoneOwner}?text=Olá! Segue o interesse no \${v.brand} \${v.name}\" target=\"_blank\" class=\"mt-auto block w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] font-black text-center uppercase tracking-widest shadow-xl shadow-green-500/30 hover:scale-[1.02] transition-all\">Tenho Interesse</a>
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
