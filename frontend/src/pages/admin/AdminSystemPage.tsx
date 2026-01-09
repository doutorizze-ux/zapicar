
import { useState, useEffect } from 'react';
import { Upload, Save, Globe, Palette, Type } from 'lucide-react';
import { API_URL } from '../../config';
import { useSystem } from '../../contexts/SystemContext';

export function AdminSystemPage() {
    const { settings, refreshSettings } = useSystem();
    const [formData, setFormData] = useState({
        siteName: '',
        primaryColor: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                siteName: settings.siteName,
                primaryColor: settings.primaryColor
            });
        }
    }, [settings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/system/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                await refreshSettings();
                alert('Configurações salvas com sucesso!');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/system/settings/logo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataUpload
            });
            if (res.ok) {
                await refreshSettings();
                alert('Logo atualizada com sucesso!');
            }
        } catch (e) {
            console.error(e);
            alert('Erro no upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
                <p className="text-gray-500 mt-2">Personalize a marca da plataforma (White-label).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Branding Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b pb-4">
                        <Type className="w-5 h-5 text-blue-600" />
                        Identidade Visual
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Plataforma</label>
                            <input
                                type="text"
                                value={formData.siteName}
                                onChange={e => setFormData({ ...formData, siteName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                placeholder="Ex: Zapicar"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor Principal</label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="h-10 w-20 border-none bg-transparent cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.primaryColor}
                                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-mono text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>

                {/* Logo Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b pb-4">
                        <Globe className="w-5 h-5 text-green-600" />
                        Logo do Sistema
                    </div>

                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                        {settings.siteLogo ? (
                            <img
                                src={settings.siteLogo.startsWith('/') ? settings.siteLogo : `${API_URL}${settings.siteLogo}`}
                                alt="Current Logo"
                                className="h-16 mb-6 object-contain"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-6 flex items-center justify-center">
                                <Globe className="w-10 h-10 text-gray-400" />
                            </div>
                        )}

                        <label className="cursor-pointer group">
                            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                            <div className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 flex items-center gap-2 group-hover:bg-gray-50 transition-all shadow-sm">
                                <Upload className="w-5 h-5 text-blue-600" />
                                {uploading ? 'Enviando...' : 'Fazer Upload da Logo'}
                            </div>
                        </label>
                        <p className="mt-4 text-xs text-gray-400">Tamanho recomendado: 512x128px (PNG transparente)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
