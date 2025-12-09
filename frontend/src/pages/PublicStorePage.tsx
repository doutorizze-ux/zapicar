import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, MapPin, Fuel, Gauge, Share2 } from 'lucide-react';

interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    km: number;
    fuel: string;
    transmission: string;
    color: string;
    images?: string[];
}

interface Store {
    id: string;
    name: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
}

export function PublicStorePage() {
    const { slug } = useParams();
    const [store, setStore] = useState<Store | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/public/store/${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    setStore(data.store);
                    setVehicles(data.vehicles);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchStoreData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !store) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Loja não encontrada 😕</h1>
                <p className="text-gray-600">O endereço pode estar incorreto ou a loja não está mais disponível.</p>
                <a href="/" className="mt-8 text-blue-600 hover:underline">Voltar para ZapCar</a>
            </div>
        );
    }

    const handleWhatsAppClick = (vehicle: Vehicle) => {
        if (!store.phone) return;
        const phone = store.phone.replace(/\D/g, '');
        const message = `Olá! Vi o *${vehicle.brand} ${vehicle.model}* no site da loja e gostaria de mais informações.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header / Hero */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {store.logoUrl ? (
                            <img src={store.logoUrl} alt={store.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                {store.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">{store.name}</h1>
                            <p className="text-sm text-gray-500">Estoque Premium</p>
                        </div>
                    </div>

                    <a
                        href={`https://wa.me/${store.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
                    >
                        <Phone className="w-5 h-5" />
                        <span className="hidden sm:inline">Fale Conosco</span>
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Banner / Store Info (Optional) */}
                <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl p-8 mb-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Encontre seu próximo carro aqui.</h2>
                        <p className="text-blue-100 text-lg mb-8">Qualidade, procedência e as melhores taxas do mercado você encontra na {store.name}.</p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                <Share2 className="w-5 h-5 text-blue-300" />
                                <span>Compartilhar Loja</span>
                            </div>
                            {/* Add more stats or badges here */}
                        </div>
                    </div>
                </div>

                {/* Filters (Simplified for V1) */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Veículos Disponíveis ({vehicles.length})</h2>
                    {/* Add simple sort or filter if needed */}
                </div>

                {/* Grid */}
                {vehicles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <p className="text-gray-500 text-xl">Nenhum veículo disponível no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {vehicles.map(vehicle => (
                            <div key={vehicle.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                                {/* Image Slider Placeholder */}
                                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                    {vehicle.images && vehicle.images.length > 0 ? (
                                        <img
                                            src={vehicle.images[0].startsWith('http') ? vehicle.images[0] : `${import.meta.env.VITE_API_URL}${vehicle.images[0]}`}
                                            alt={vehicle.model}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                            <span className="text-6xl opacity-20"><Fuel /></span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                        {vehicle.year}
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{vehicle.brand}</p>
                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{vehicle.model}</h3>
                                        <p className="text-sm text-gray-500">{vehicle.fuel} • {vehicle.transmission}</p>
                                    </div>

                                    <div className="flex items-end justify-between mb-6">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Valor à vista</p>
                                            <p className="text-2xl font-bold text-gray-900">R$ {Number(vehicle.price).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-1.5">
                                            <Gauge className="w-4 h-4 text-gray-400" />
                                            {vehicle.km.toLocaleString()} km
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {/* Location would go here */}
                                            Loja SP
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleWhatsAppClick(vehicle)}
                                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-green-500/20"
                                    >
                                        <Phone className="w-5 h-5" />
                                        Tenho Interesse
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-20 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 mb-2">Powered by</p>
                    <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <span className="font-bold text-xl tracking-tight text-gray-900">ZapCar</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
