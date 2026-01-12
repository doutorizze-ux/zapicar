import { X, Upload, FileText, Share2, Copy, Check, Instagram, Car, FileCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { toPng } from 'html-to-image';

const CAR_BRANDS = [
    'Toyota', 'Honda', 'Hyundai', 'Volkswagen', 'Chevrolet', 'Ford', 'Fiat', 'Jeep', 'Renault', 'Nissan',
    'Mitsubishi', 'BMW', 'Mercedes-Benz', 'Audi', 'Kia', 'Peugeot', 'Citroën', 'Land Rover', 'Volvo', 'Outra'
];

interface VehicleManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

type Tab = 'details' | 'documents' | 'marketing';

export function VehicleManagerModal({ isOpen, onClose, onSuccess, initialData }: VehicleManagerModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [loading, setLoading] = useState(false);
    const [store, setStore] = useState<any>(null);
    const flyerRef = useRef<HTMLDivElement>(null);

    // Form Data (Details Tab)
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [docFiles, setDocFiles] = useState<File[]>([]);
    const [formData, setFormData] = useState({
        brand: 'Toyota', name: '', model: '', year: new Date().getFullYear(),
        price: '', costPrice: '', category: 'Seminovo', km: 0, fuel: 'Flex',
        transmission: 'Automático', color: '', description: '', location: '',
        trava: false, alarme: false, som: false, teto: false, banco_couro: false,
    });

    // Marketing Data
    const [marketingText, setMarketingText] = useState('');
    const [copied, setCopied] = useState(false);
    const [flyerColor, setFlyerColor] = useState('#22c55e');
    const [selectedFlyerImage, setSelectedFlyerImage] = useState(0);
    const [flyerFormat, setFlyerFormat] = useState<'story' | 'feed'>('story');

    // Initialize
    useEffect(() => {
        fetchStore();
        if (initialData) {
            setFormData({
                brand: initialData.brand,
                name: initialData.name,
                model: initialData.model || '',
                year: initialData.year,
                price: initialData.price ? initialData.price.toString().replace('.', ',') : '',
                category: initialData.category,
                km: initialData.km,
                fuel: initialData.fuel || 'Flex',
                transmission: initialData.transmission || 'Automático',
                color: initialData.color || '',
                description: initialData.description || '',
                location: initialData.location || '',
                trava: initialData.trava || false,
                alarme: initialData.alarme || false,
                som: initialData.som || false,
                teto: initialData.teto || false,
                banco_couro: initialData.banco_couro || false,
                costPrice: initialData.costPrice ? initialData.costPrice.toString().replace('.', ',') : '',
            });
            setExistingImages(initialData.images || []);
            setDocFiles([]); // Reset pending docs
            setImageFiles([]); // Reset pending images
            generateMarketingText();
        } else {
            setFormData({
                brand: 'Toyota', name: '', model: '', year: new Date().getFullYear(),
                price: '', costPrice: '', category: 'Seminovo', km: 0, fuel: 'Flex',
                transmission: 'Automático', color: '', description: '', location: '',
                trava: false, alarme: false, som: false, teto: false, banco_couro: false,
            });
            setExistingImages([]);
            setDocFiles([]);
            setImageFiles([]);
        }
    }, [initialData, isOpen]);

    const fetchStore = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const user = await res.json();
                setStore(user);
                if (user.primaryColor) setFlyerColor(user.primaryColor);
            }
        } catch (e) {
            console.error('Error fetching store', e);
        }
    };

    const formatMoneyRequest = (value: string) => {
        if (!value) return 0;
        const clean = value.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name } = e.target;
        let value = e.target.value.replace(/\D/g, '');
        value = (Number(value) / 100).toFixed(2) + '';
        value = value.replace('.', ',');
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const currentCount = existingImages.length + imageFiles.length;
            const remainingSlots = 5 - currentCount;

            if (remainingSlots <= 0) return;

            const newFiles = Array.from(e.target.files).slice(0, remainingSlots);
            setImageFiles([...imageFiles, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    // --- Document Logic ---
    const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDocFiles([...docFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeDocFile = (index: number) => {
        setDocFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadDocs = async () => {
        if (!initialData || docFiles.length === 0) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const uploadData = new FormData();
            docFiles.forEach(file => uploadData.append('files', file));
            const res = await fetch(`${API_URL}/vehicles/${initialData.id}/upload-doc`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadData
            });
            if (res.ok) {
                alert('Documentos enviados com sucesso!');
                setDocFiles([]);
                onSuccess(); // Refresh parent to get new docs
            } else {
                alert('Erro ao enviar documentos.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData) return;

        const confirmed = window.confirm(`Tem certeza que deseja excluir o veículo ${formData.brand} ${formData.name}? Esta ação não pode ser desfeita.`);
        if (!confirmed) return;

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/vehicles/${initialData.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Erro ao excluir veículo');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const payload = {
                ...formData,
                price: formatMoneyRequest(formData.price),
                costPrice: formatMoneyRequest(formData.costPrice),
                year: Number(formData.year),
                km: Number(formData.km),
                images: initialData ? existingImages : [] // Use modified list if editing
            };

            let response;
            let vehicleId;

            if (initialData) {
                response = await fetch(`${API_URL}/vehicles/${initialData.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
                vehicleId = initialData.id;
            } else {
                response = await fetch(`${API_URL}/vehicles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                vehicleId = data.id;
            }

            if (response.ok && vehicleId) {
                if (imageFiles.length > 0) {
                    const uploadData = new FormData();
                    imageFiles.forEach(file => uploadData.append('files', file));
                    await fetch(`${API_URL}/vehicles/${vehicleId}/upload`, { method: 'POST', body: uploadData });
                }
                onSuccess();
                if (!initialData) onClose(); // Close on create, stay on edit
                else alert('Veículo atualizado!');
            } else {
                alert('Erro ao salvar veículo');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com servidor');
        } finally {
            setLoading(false);
        }
    };

    // --- Marketing Generator ---
    const generateMarketingText = () => {
        if (!initialData && !formData.name) return;
        const data = initialData || formData;
        const text = `🔥 ${data.brand} ${data.name} ${data.model} - Oportunidade!

📅 Ano: ${data.year}
⚙️ Motor: ${data.fuel}
🕹 Câmbio: ${data.transmission || 'Automático'}
🎨 Cor: ${data.color || 'Não informada'}
🛣 KM: ${data.km}km

✅ Completo e Revisado!
${data.trava ? '✅ Trava Elétrica\n' : ''}${data.alarme ? '✅ Alarme\n' : ''}${data.som ? '✅ Som Multimídia\n' : ''}${data.banco_couro ? '✅ Bancos de Couro\n' : ''}
💰 VALOR: R$ ${data.price}

📍 Venha conferir pessoalmente! 
📲 Mande uma mensagem agora pra saber mais.

#${data.brand.toLowerCase()} #${data.name.toLowerCase().replace(/\s/g, '')} #carros #seminovos #oportunidade #vendas`;
        setMarketingText(text);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(marketingText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadFlyer = async () => {
        if (!flyerRef.current) return;
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay

            // Ensure images are fully loaded
            const images = flyerRef.current.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const options = {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: '#0f172a',
                width: 300,
                height: flyerFormat === 'story' ? 533 : 300,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: '300px',
                    height: flyerFormat === 'story' ? '533px' : '300px'
                }
            };

            const dataUrl = await toPng(flyerRef.current, options);

            const link = document.createElement('a');
            link.download = `flyer-${flyerFormat}-${formData.name || 'car'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error generating flyer', err);
            alert('Erro ao gerar flyer. Tente novamente ou use outro navegador.');
        } finally {
            setLoading(false);
        }
    };

    const shareFlyer = async () => {
        if (!flyerRef.current) return;
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Ensure images are fully loaded
            const images = flyerRef.current.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const dataUrl = await toPng(flyerRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#0f172a',
                width: 300,
                height: flyerFormat === 'story' ? 533 : 300,
                style: {
                    transform: 'scale(1)',
                    width: '300px',
                    height: flyerFormat === 'story' ? '533px' : '300px'
                }
            });

            // Improved blob conversion
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `flyer-${formData.brand}-${formData.name}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Flyer do Veículo',
                    text: `Confira este ${formData.brand} ${formData.name}!`
                });
            } else {
                // Fallback
                const link = document.createElement('a');
                link.download = `flyer-${formData.name}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Error sharing flyer', err);
            alert('Seu dispositivo não suporta o compartilhamento direto.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Logic ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Car className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">{initialData ? formData.name : 'Novo Veículo'}</h3>
                            <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">Gerenciador Inteligente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-4 md:px-6 gap-4 md:gap-8 bg-gray-50/50 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Car className="w-4 h-4" /> Detalhes
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`py-4 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'documents' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileCheck className="w-4 h-4" /> Documentos
                    </button>
                    <button
                        onClick={() => { setActiveTab('marketing'); generateMarketingText(); }}
                        className={`py-4 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'marketing' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Share2 className="w-4 h-4" /> Marketing
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30">

                    {/* --- DETAILS TAB --- */}
                    {activeTab === 'details' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload Area */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> Fotos da Galeria</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {/* Existing Images */}
                                    {existingImages.map((img: string, idx: number) => (
                                        <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={img.startsWith('http') ? img : `${API_URL}${img}`} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}

                                    {imageFiles.map((file, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-green-200 ring-2 ring-green-100 group">
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}

                                    {(existingImages.length + imageFiles.length) < 5 && (
                                        <label className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center aspect-square hover:bg-gray-50 cursor-pointer transition-colors relative">
                                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500 font-medium">Adicionar Foto</span>
                                            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-right">
                                    {existingImages.length + imageFiles.length} / 5 fotos
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-2">Dados Principais</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Marca</label>
                                            <select name="brand" value={formData.brand} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg"><option value="Toyota">Toyota</option>{CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}</select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Modelo/Versão</label>
                                            <input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="Ex: Corolla XEi" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Ano</label><input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">KM</label><input type="number" name="km" value={formData.km} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Cor</label><input name="color" value={formData.color} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Preço de Venda (R$)</label><input name="price" value={formData.price} onChange={handlePriceChange} className="w-full mt-1 p-2 border rounded-lg font-bold text-green-700" placeholder="0,00" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Preço de Custo (R$)</label><input name="costPrice" value={formData.costPrice} onChange={handlePriceChange} className="w-full mt-1 p-2 border rounded-lg font-bold text-red-700" placeholder="0,00" /></div>
                                    </div>

                                    {/* Profit Indicator */}
                                    {formData.price && formData.costPrice && (
                                        <div className="p-3 bg-gray-900 rounded-xl flex items-center justify-between text-white border-t-4 border-green-500">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lucro Estimado</p>
                                                <p className="text-lg font-black text-green-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formatMoneyRequest(formData.price) - formatMoneyRequest(formData.costPrice))}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Margem</p>
                                                <p className="font-bold text-sm">
                                                    {((formatMoneyRequest(formData.price) - formatMoneyRequest(formData.costPrice)) / formatMoneyRequest(formData.price) * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-2">Especificações</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Câmbio</label><input name="transmission" value={formData.transmission} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Combustível</label><input name="fuel" value={formData.fuel} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                    </div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Opcionais</label>
                                        <div className="flex flex-wrap gap-3 mt-2">
                                            {[
                                                { k: 'trava', l: 'Trava' }, { k: 'alarme', l: 'Alarme' },
                                                { k: 'som', l: 'Som' }, { k: 'teto', l: 'Teto Solar' }, { k: 'banco_couro', l: 'Couro' }
                                            ].map(opt => (
                                                <label key={opt.k} className="flex items-center gap-1.5 cursor-pointer bg-white border px-2 py-1 rounded-md hover:bg-gray-50"><input type="checkbox" name={opt.k} checked={(formData as any)[opt.k]} onChange={handleCheckboxChange} className="rounded text-green-600" /><span className="text-xs">{opt.l}</span></label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                                <div>
                                    {initialData && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={loading}
                                            className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors text-sm flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Excluir Veículo
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                                    <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* --- DETAILS TAB --- */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            {/* Header / Intro */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 text-lg">Central de Documentos</h3>
                                    <p className="text-blue-700/80 text-sm mt-1">
                                        Armazene aqui contratos, CRLV, laudos e manuais deste veículo.
                                        Arquivos suportados: PDF e Imagens.
                                    </p>
                                </div>
                            </div>

                            {/* Existing Documents List */}
                            {initialData?.documents && initialData.documents.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Arquivos Salvos</h4>
                                    <div className="grid gap-3">
                                        {initialData.documents.map((doc: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                        <FileCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 line-clamp-1">{doc.name}</p>
                                                        <p className="text-xs text-gray-500">{new Date(doc.date).toLocaleDateString()} • {doc.type?.split('/')[1]?.toUpperCase() || 'ARQUIVO'}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={doc.url.startsWith('http') ? doc.url : `${API_URL}${doc.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={doc.name}
                                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                >
                                                    Baixar
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload New Documents */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Adicionar Novos Documentos</h4>

                                {docFiles.length > 0 && (
                                    <div className="grid gap-2 mb-4">
                                        {docFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                                                <span className="text-sm text-green-800 font-medium truncate">{file.name}</span>
                                                <button onClick={() => removeDocFile(i)} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer group">
                                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                        <span className="text-gray-500 font-medium group-hover:text-blue-600">Clique para selecionar arquivos</span>
                                        <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 10MB)</span>
                                        <input type="file" multiple onChange={handleDocFileChange} className="hidden" accept=".pdf,image/*" />
                                    </label>
                                </div>

                                {docFiles.length > 0 && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={handleUploadDocs}
                                            disabled={loading}
                                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                        >
                                            {loading ? 'Enviando...' : `Enviar ${docFiles.length} Arquivo(s)`}
                                            <Upload className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- MARKETING TAB --- */}
                    {activeTab === 'marketing' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Text Area */}
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 md:p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <Instagram className="w-6 h-6 md:w-8 md:h-8" />
                                        <div>
                                            <h3 className="font-bold text-lg md:text-xl">Legenda para Post</h3>
                                            <p className="text-white/80 text-xs md:text-sm">Pronta para Instagram e Facebook.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={marketingText}
                                        onChange={(e) => setMarketingText(e.target.value)}
                                        className="w-full h-80 p-4 bg-white border border-gray-200 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none shadow-sm"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-xl"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copiado!' : 'Copiar Texto'}
                                    </button>
                                </div>
                            </div>

                            {/* Flyer Generator */}
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 md:p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <Share2 className="w-6 h-6 md:w-8 md:h-8" />
                                        <div>
                                            <h3 className="font-bold text-lg md:text-xl">Gerador de Flyer</h3>
                                            <p className="text-white/80 text-xs md:text-sm">Crie um Stories profissional em 1 clique.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Formato</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setFlyerFormat('story')}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all ${flyerFormat === 'story' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                >
                                                    Story (9:16)
                                                </button>
                                                <button
                                                    onClick={() => setFlyerFormat('feed')}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all ${flyerFormat === 'feed' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                >
                                                    Feed (1:1)
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Cor de Destaque</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#000000'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setFlyerColor(c)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${flyerColor === c ? 'border-gray-900 ring-2 ring-gray-200' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                                <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden">
                                                    <input
                                                        type="color"
                                                        value={flyerColor}
                                                        onChange={(e) => setFlyerColor(e.target.value)}
                                                        className="absolute inset-[-5px] w-[200%] h-[200%] cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {existingImages.length > 1 && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Selecionar Imagem</label>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {existingImages.map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedFlyerImage(idx)}
                                                        className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedFlyerImage === idx ? 'border-green-500 ring-2 ring-green-100' : 'border-transparent opacity-60'}`}
                                                    >
                                                        <img src={img.startsWith('http') ? img : `${API_URL}${img}`} className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Flyer Preview (The target for capture) */}
                                <div className="flex justify-center w-full overflow-hidden py-4">
                                    <div
                                        className="relative"
                                        style={{
                                            width: '300px',
                                            height: flyerFormat === 'story' ? '533px' : '300px',
                                            transform: 'scale(1)',
                                            maxWidth: '100%',
                                            transition: 'height 0.3s ease'
                                        }}
                                    >
                                        <div
                                            ref={flyerRef}
                                            className={`bg-slate-950 relative overflow-hidden shadow-2xl rounded-xl flex flex-col ${flyerFormat === 'story' ? 'w-[300px] h-[533px]' : 'w-[300px] h-[300px]'}`}
                                        >
                                            {/* Advanced Background: Blurred + Darkened */}
                                            {existingImages[selectedFlyerImage] && (
                                                <div className="absolute inset-0 z-0">
                                                    <img
                                                        src={existingImages[selectedFlyerImage]?.startsWith('http') ? existingImages[selectedFlyerImage] : (API_URL + existingImages[selectedFlyerImage])}
                                                        className="w-full h-full object-cover blur-md opacity-30 scale-110"
                                                        crossOrigin="anonymous"
                                                        alt="Blur background"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950" />
                                                </div>
                                            )}

                                            {/* Store Header */}
                                            {/* Store Header */}
                                            {/* Store Header */}
                                            <div className={`relative z-20 flex flex-col items-center ${flyerFormat === 'story' ? 'pt-16 pb-2' : 'pt-3 pb-1'}`}>
                                                {store?.logoUrl ? (
                                                    <div className="bg-white p-2 rounded-xl shadow-lg max-w-[90px] min-h-[40px] flex items-center justify-center">
                                                        <img
                                                            src={store.logoUrl.startsWith('http') ? store.logoUrl : `${API_URL}${store.logoUrl}`}
                                                            className={`${flyerFormat === 'story' ? 'h-8' : 'h-5'} w-auto object-contain max-w-full`}
                                                            crossOrigin="anonymous"
                                                            alt="Logo"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                                        <p className="text-white text-[7px] font-black uppercase tracking-widest">{store?.storeName || 'Sua Loja'}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* HERO IMAGE: The Car */}
                                            <div className={`relative z-10 px-4 ${flyerFormat === 'story' ? 'mt-1' : 'mt-0'}`}>
                                                <div className={`relative overflow-hidden border-2 border-white/10 shadow-2xl bg-slate-900 flex items-center justify-center ${flyerFormat === 'story' ? 'h-[170px] rounded-xl' : 'h-[100px] w-full rounded-xl'}`}>
                                                    {existingImages[selectedFlyerImage] ? (
                                                        <img
                                                            src={existingImages[selectedFlyerImage]?.startsWith('http') ? existingImages[selectedFlyerImage] : (API_URL + existingImages[selectedFlyerImage])}
                                                            className="w-full h-full object-contain" // Contain garante a visibilidade total
                                                            crossOrigin="anonymous"
                                                            alt="Main car image"
                                                        />
                                                    ) : (
                                                        <Car className="w-12 h-12 text-white/20" />
                                                    )}

                                                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] font-black text-slate-950 shadow-md uppercase">
                                                        {formData.category || 'Seminovo'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info Section */}
                                            <div className="relative z-20 flex-1 px-4 py-3 flex flex-col justify-between text-white overflow-hidden">
                                                <div className={`${flyerFormat === 'story' ? 'space-y-4' : 'space-y-2'}`}>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60" style={{ color: flyerColor }}>Oportunidade</p>
                                                        <h4 className={`${flyerFormat === 'story' ? 'text-xl' : 'text-sm'} font-black uppercase leading-tight tracking-tighter`}>
                                                            {formData.brand} <span className={flyerFormat === 'story' ? 'block' : ''} style={{ color: flyerColor }}>{formData.name}</span>
                                                        </h4>
                                                    </div>

                                                    {flyerFormat === 'story' && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { label: 'Ano', val: formData.year },
                                                                { label: 'KM', val: `${formData.km}` },
                                                                { label: 'Câmbio', val: formData.transmission },
                                                                { label: 'Motor', val: formData.fuel }
                                                            ].map((spec, i) => (
                                                                <div key={i} className="flex flex-col p-1.5 bg-white/5 border border-white/10 rounded-xl">
                                                                    <span className="text-[6px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">{spec.label}</span>
                                                                    <span className="text-[9px] font-black truncate leading-none">{spec.val}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`${flyerFormat === 'story' ? 'mt-auto space-y-3 pb-2' : 'mt-2 space-y-2'}`}>
                                                    <div className="flex items-end justify-between gap-2">
                                                        <div className="w-full">
                                                            <p className="text-[7px] font-bold uppercase tracking-widest opacity-40">Valor Especial</p>
                                                            <div className="flex items-baseline justify-between w-full">
                                                                <p className={`${flyerFormat === 'story' ? 'text-3xl' : 'text-base'} font-black tracking-tighter tabular-nums drop-shadow-lg text-white`}>
                                                                    R$ {formData.price.includes(',') ? formData.price : new Intl.NumberFormat('pt-BR').format(Number(formData.price))}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer Branding */}
                                                    {/* Footer Branding */}
                                                    <div className={`${flyerFormat === 'story' ? 'p-3 mb-10' : 'p-1 pb-1'} bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between`}>
                                                        <div className="flex flex-col">
                                                            <p className="text-[5px] font-bold text-white/50 uppercase tracking-widest leading-none mb-0.5">Fale Conosco</p>
                                                            <p className={`${flyerFormat === 'story' ? 'text-[10px]' : 'text-[8px]'} font-black truncate max-w-[150px] leading-tight`}>{store?.storeName || 'Zapcar'}</p>
                                                        </div>
                                                        <div
                                                            className={`${flyerFormat === 'story' ? 'w-8 h-8' : 'w-5 h-5'} rounded-full flex items-center justify-center shadow-lg border border-white/20`}
                                                            style={{ backgroundColor: flyerColor }}
                                                        >
                                                            <Instagram className={`${flyerFormat === 'story' ? 'w-4 h-4' : 'w-2.5 h-2.5'} text-white`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Design Elements */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-[100px] pointer-events-none" />
                                            <div className="absolute inset-3 border border-white/5 rounded-2xl pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={downloadFlyer}
                                        disabled={loading}
                                        className="text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 hover:brightness-110 border-2 border-white/10"
                                        style={{ backgroundColor: `${flyerColor}CC`, backdropFilter: 'blur(10px)' }}
                                    >
                                        <Upload className="w-5 h-5 rotate-180" />
                                        {loading ? '...' : 'Baixar'}
                                    </button>
                                    <button
                                        onClick={shareFlyer}
                                        disabled={loading}
                                        className="text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 hover:brightness-110"
                                        style={{ backgroundColor: flyerColor, boxShadow: `0 10px 15px -3px ${flyerColor}44` }}
                                    >
                                        <Instagram className="w-5 h-5" />
                                        {loading ? '...' : 'Instagram'}
                                    </button>
                                </div>

                                <p className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                    Resolução sugerida: {flyerFormat === 'story' ? '1080x1920 (9:16)' : '1080x1080 (1:1)'}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
