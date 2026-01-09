
import { Store, CreditCard, LogOut, MessageCircle, Upload, Save, Pencil, Globe, ExternalLink, Image as ImageIcon, Download } from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export function SettingsPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState({
        name: "Carregando...",
        email: "...",
        phone: "",
        slug: "",
        primaryColor: "#000000",
        address: "",
        storeDescription: "",
        plan: "Plano Gratuito",
        logoUrl: "",
        coverUrl: "",
        status: "unknown",
        nextBilling: "-"
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", phone: "", slug: "", primaryColor: "#000000", address: "", storeDescription: "" });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [hasWebsiteFeature, setHasWebsiteFeature] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();

                // Check Plan Features
                if (data.planId) {
                    try {
                        const planRes = await fetch(`${API_URL}/plans/${data.planId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const planData = await planRes.json();
                        const features = Array.isArray(planData.features) ? planData.features : [];
                        setHasWebsiteFeature(features.some((f: string) => f.includes('Site Personalizado')));
                    } catch (e) {
                        console.error(e);
                    }
                }

                let subInfo = 'Sem Plano';
                let nextBilling = '-';
                let subStatus = 'unknown';

                if (data.subscriptionId) {
                    try {
                        const subRes = await fetch(`${API_URL}/subscriptions/my-subscription`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const subData = await subRes.json();
                        subInfo = subData.planName || 'Plano Ativo';
                        subStatus = (subData.status === 'ACTIVE' || subData.latestPaymentStatus === 'RECEIVED') ? 'ACTIVE' : subData.status;
                        if (subData.nextDueDate) nextBilling = new Date(subData.nextDueDate).toLocaleDateString('pt-BR');
                    } catch (e) {
                        console.error(e);
                    }
                }

                setUser({
                    name: data.storeName || 'Minha Loja',
                    email: data.email,
                    phone: data.phone || '',
                    plan: subInfo,
                    logoUrl: data.logoUrl,
                    slug: data.slug || '',
                    primaryColor: data.primaryColor || '#000000',
                    address: data.address || '',
                    storeDescription: data.storeDescription || '',
                    status: subStatus,
                    nextBilling: nextBilling,
                    coverUrl: data.coverUrl
                });

                setEditForm({
                    name: data.storeName || 'Minha Loja',
                    phone: data.phone || '',
                    slug: data.slug || '',
                    primaryColor: data.primaryColor || '#000000',
                    address: data.address || '',
                    storeDescription: data.storeDescription || ''
                });
            } else {
                if (response.status === 401) navigate('/login');
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [navigate]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    storeName: editForm.name,
                    phone: editForm.phone,
                    slug: editForm.slug,
                    primaryColor: editForm.primaryColor,
                    address: editForm.address,
                    storeDescription: editForm.storeDescription
                })
            });

            if (response.ok) {
                await fetchProfile();
                setIsEditing(false);
                alert('Perfil atualizado!');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.[0]) return;
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('file', event.target.files[0]);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/logo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (response.ok) await fetchProfile();
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.[0]) return;
        setUploadingCover(true);
        const formData = new FormData();
        formData.append('file', event.target.files[0]);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/cover`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (response.ok) await fetchProfile();
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleDownloadSite = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/export-site`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const { html } = await res.json();
                const blob = new Blob([html], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `index.html`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao baixar site.');
        }
    };

    const getImageUrl = (url?: string) => {
        if (!url) return "";
        if (url.startsWith('http')) return url;
        return `${API_URL.replace('/api', '')}${url}`;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-500 mt-1">Gerencie sua conta e as informações da sua loja.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-sm md:text-base">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200">
                                {user.logoUrl ? <img src={getImageUrl(user.logoUrl)} className="w-full h-full object-contain" /> : <Store className="w-8 h-8 text-gray-400" />}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Upload className="w-6 h-6" /></div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Perfil da Loja</h3>
                            <button onClick={() => coverInputRef.current?.click()} className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1 mt-1">
                                <ImageIcon className="w-3 h-3" /> {uploadingCover ? 'Enviando...' : 'Alterar Capa do Site'}
                            </button>
                            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="font-bold text-gray-700">Nome da Loja</label>
                        <input value={isEditing ? editForm.name : user.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} disabled={!isEditing} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-60" />
                    </div>
                    <div className="space-y-2">
                        <label className="font-bold text-gray-700">Telefone / WhatsApp</label>
                        <input value={isEditing ? editForm.phone : user.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} disabled={!isEditing} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-60" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="font-bold text-gray-700">Endereço</label>
                        <input value={isEditing ? editForm.address : user.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} disabled={!isEditing} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-60" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="font-bold text-gray-700">Descrição / Slogan</label>
                        <textarea value={isEditing ? editForm.storeDescription : user.storeDescription} onChange={e => setEditForm({ ...editForm, storeDescription: e.target.value })} disabled={!isEditing} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-60 resize-none" />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" /> Presença Online
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="font-bold text-gray-700">Link da Loja (Slug)</label>
                                {hasWebsiteFeature ? (
                                    <div className="flex gap-2">
                                        <input value={isEditing ? editForm.slug : user.slug} onChange={e => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} disabled={!isEditing} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-60" />
                                        {!isEditing && user.slug && (
                                            <a href={`/${user.slug}`} target="_blank" className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors"><ExternalLink className="w-5 h-5" /></a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500 italic">Disponível em planos superiores.</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold text-gray-700">Cor do Site</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={isEditing ? editForm.primaryColor : user.primaryColor} onChange={e => setEditForm({ ...editForm, primaryColor: e.target.value })} disabled={!isEditing} className="w-12 h-12 rounded-xl cursor-pointer disabled:opacity-50" />
                                    <span className="font-mono text-gray-500">{isEditing ? editForm.primaryColor : user.primaryColor}</span>
                                </div>
                            </div>

                            {hasWebsiteFeature && (
                                <div className="md:col-span-2">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0"><Download className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-bold text-blue-900">Exportar Meu Site</p>
                                                <p className="text-xs text-blue-700">Baixe o código-fonte (index.html) para hospedar em seu próprio domínio.</p>
                                            </div>
                                        </div>
                                        <button onClick={handleDownloadSite} className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">Baixar index.html</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-6 flex justify-end">
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-colors">Cancelar</button>
                                <button onClick={handleSaveProfile} disabled={isSaving} className="px-8 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 flex items-center gap-2">
                                    {isSaving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-colors flex items-center gap-2">
                                <Pencil className="w-5 h-5" /> Editar Configurações
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
                        <div><h3 className="text-lg font-bold text-gray-900">Plano e Assinatura</h3><p className="text-xs text-gray-500">Gerencie seus pagamentos</p></div>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{user.status === 'ACTIVE' ? 'ATIVO' : 'PENDENTE'}</span>
                </div>
                <div className="p-6">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                        <div><p className="font-bold text-gray-900">{user.plan}</p><p className="text-xs text-gray-500">Próxima renovação: {user.nextBilling}</p></div>
                        <button onClick={() => navigate('/dashboard/plans')} className="text-green-600 font-bold text-sm hover:underline">Ver Planos</button>
                    </div>
                </div>
            </div>

            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-6 py-3 rounded-2xl transition-colors">
                <LogOut className="w-5 h-5" /> Sair da Conta
            </button>
        </div>
    );
}
