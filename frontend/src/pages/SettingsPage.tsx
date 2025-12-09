import { Store, CreditCard, LogOut, MessageCircle, Upload, Save, Pencil, Globe } from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

import { useState, useEffect, useRef } from 'react';

export function SettingsPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState({
        name: "Carregando...",
        email: "...",
        phone: "",
        plan: "Plano Gratuito",
        logoUrl: ""
    });

    const storeSlug = user.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", phone: "" });
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser({
                    name: data.storeName || 'Minha Loja',
                    email: data.email,
                    phone: data.phone || '',
                    plan: 'Plano Beta (Ilimitado)',
                    logoUrl: data.logoUrl
                });
                setEditForm({ name: data.storeName || 'Minha Loja', phone: data.phone || '' });
            } else {
                if (response.status === 401) navigate('/login');
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const [isSaving, setIsSaving] = useState(false);

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
                body: JSON.stringify({ storeName: editForm.name, phone: editForm.phone })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(prev => ({
                    ...prev,
                    name: updatedUser.storeName,
                    phone: updatedUser.phone
                }));
                setIsEditing(false);
                alert('Perfil atualizado com sucesso!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Save error:', response.status, errorData);
                alert(`Erro ao salvar: ${response.status} - ${errorData.message || 'Tente novamente.'}`);
            }
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Erro de conexão ao tentar salvar. Verifique sua internet.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        setUploadingLogo(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/logo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                await fetchProfile(); // Refresh to get new logo URL
            } else {
                alert('Erro ao enviar logo. Tente novamente.');
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploadingLogo(false);
        }
    };

    const getImageUrl = (url?: string) => {
        if (!url) return "";
        if (url.startsWith('http')) return url;

        // Em desenvolvimento local, precisamos apontar para o backend explicitamente
        if (import.meta.env.DEV && url.startsWith('/')) {
            return `http://localhost:3000${url}`;
        }

        // Em produção, /uploads/... será servido pelo mesmo domínio (via Nginx proxy)
        // Se a url vier como "http://localhost:3000/..." do banco legado, tentamos corrigir
        if (url.includes('localhost:3000') && !import.meta.env.DEV) {
            return url.replace('http://localhost:3000', '').replace('https://localhost:3000', '');
        }

        return url;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-500 mt-1">Gerencie sua conta, nome da loja e telefone para contato.</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                {user.logoUrl ? (
                                    <img src={getImageUrl(user.logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Store className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Perfil da Loja</h3>
                            <p className="text-sm text-gray-500">
                                {uploadingLogo ? 'Enviando logo...' : 'Clique na logo para alterar'}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Store Link Card - NEW */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-blue-100 uppercase tracking-wider text-xs">Novidade</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Sua Vitrine Virtual está no ar! 🚀</h2>
                            <p className="text-blue-100 max-w-xl">
                                Agora você tem um site profissional com todo seu estoque atualizado automaticamente.
                                Compartilhe o link abaixo nas suas redes sociais!
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="bg-white/10 p-3 rounded-xl border border-white/20 flex items-center gap-3 backdrop-blur-sm">
                                <code className="text-sm font-mono text-blue-50">
                                    zapicar.com.br/loja/{storeSlug}
                                </code>
                            </div>
                            <a
                                href={`/loja/${storeSlug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors text-center shadow-lg"
                            >
                                Acessar Meu Site
                            </a>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
                        <input
                            value={isEditing ? editForm.name : user.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2 border rounded-xl transition-colors ${isEditing ? 'bg-white border-blue-500 ring-2 ring-blue-500/20' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp / Telefone (para IA)</label>
                        <input
                            value={isEditing ? editForm.phone : user.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            disabled={!isEditing}
                            placeholder="Ex: 11999999999"
                            className={`w-full px-4 py-2 border rounded-xl transition-colors ${isEditing ? 'bg-white border-blue-500 ring-2 ring-blue-500/20' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email de Acesso</label>
                        <input value={user.email} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="flex items-end">
                        {isEditing ? (
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Salvando...' : (
                                    <>
                                        <Save className="w-5 h-5" /> Salvar Alterações
                                    </>
                                )}
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="w-full py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-blue-600 border border-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Pencil className="w-5 h-5" /> Editar Perfil
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Plan / Subscription */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Assinatura</h3>
                            <p className="text-sm text-gray-500">Detalhes do seu plano atual</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">Ativo</span>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                            <p className="font-bold text-gray-900">{user.plan}</p>
                            <p className="text-sm text-gray-500">Próxima renovação em 05/01/2026</p>
                        </div>
                        <button className="text-blue-600 font-medium hover:underline text-sm">Gerenciar Plano</button>
                    </div>
                </div>
            </div>

            {/* AI Config (Mock) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Inteligência Artificial</h3>
                            <p className="text-sm text-gray-500">Configure como o bot responde</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Respostas Humanizadas</p>
                            <p className="text-sm text-gray-500">Usar IA Generativa (Gemini) para criar respostas naturais.</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-600 right-0" />
                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-600 cursor-pointer"></label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5" />
                    Sair da Conta
                </button>
            </div>
        </div>
    );
}
