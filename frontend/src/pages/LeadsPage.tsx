import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Phone, MessageSquare, Calendar, User, Edit } from 'lucide-react';

interface Lead {
    id: string;
    phone: string;
    name: string | null;
    lastMessage: string;
    status: 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'WON' | 'LOST';
    notes: string | null;
    updatedAt: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    NEW: { label: 'Novo', color: 'text-blue-700', bg: 'bg-blue-50' },
    CONTACTED: { label: 'Contatado', color: 'text-yellow-700', bg: 'bg-yellow-50' },
    NEGOTIATING: { label: 'Negociando', color: 'text-purple-700', bg: 'bg-purple-50' },
    WON: { label: 'Vendido', color: 'text-green-700', bg: 'bg-green-50' },
    LOST: { label: 'Perdido', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function LeadsPage() {
    const { token } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ status: '', notes: '', name: '' });


    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLeads(data);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/leads/${selectedLead.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                const updatedLead = await response.json();
                setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l));
                setIsEditing(false);
                setSelectedLead(updatedLead); // Update selected view
            }
        } catch (error) {
            console.error('Failed to update lead', error);
        }
    };

    const openEditModal = (lead: Lead) => {
        setSelectedLead(lead);
        setEditForm({
            status: lead.status,
            notes: lead.notes || '',
            name: lead.name || ''
        });
        setIsEditing(true);
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm) ||
            lead.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CRM de Leads</h1>
                    <p className="text-gray-500">Gerencie seus contatos e potenciais clientes</p>
                </div>
                <div className="flex gap-2">
                    {/* Add export or other actions here */}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou mensagem..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Todos
                    </button>
                    {Object.entries(statusMap).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === key
                                ? 'ring-2 ring-offset-1 ' + config.bg + ' ' + config.color + ' ring-gray-200'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex gap-6 flex-1 overflow-hidden">
                {/* List */}
                <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${selectedLead ? 'hidden md:flex' : 'flex'}`}>
                    <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Carregando leads...</div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <User className="w-12 h-12 text-gray-300 mb-2" />
                                <p>Nenhum lead encontrado.</p>
                            </div>
                        ) : (
                            filteredLeads.map(lead => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLead(lead)}
                                    className={`p-4 hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900">{lead.name || lead.phone}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusMap[lead.status]?.bg} ${statusMap[lead.status]?.color}`}>
                                            {statusMap[lead.status]?.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{lead.lastMessage}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(lead.updatedAt).toLocaleDateString()}
                                        </span>
                                        {lead.name && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {lead.phone.replace('@c.us', '')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Details Panel (Right Side) */}
                {selectedLead ? (
                    <div className={`w-full md:w-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col ${!selectedLead ? 'hidden' : 'flex'}`}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedLead.name || 'Sem nome'}</h2>
                                <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {selectedLead.phone.split('@')[0]}
                                </p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="md:hidden p-2 text-gray-400">
                                Fechar
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(selectedLead)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </button>
                                <a
                                    href={`https://wa.me/${selectedLead.phone.split('@')[0]}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    WhatsApp
                                </a>
                            </div>

                            {/* Status Card */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Status Atual</label>
                                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusMap[selectedLead.status]?.bg} ${statusMap[selectedLead.status]?.color}`}>
                                    {statusMap[selectedLead.status]?.label}
                                </div>
                            </div>

                            {/* Notes Card */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px]">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                    Anotações Internas
                                </label>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {selectedLead.notes || 'Nenhuma anotação...'}
                                </p>
                            </div>

                            {/* Last Message Information */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Última Interação</label>
                                <p className="text-sm text-gray-600 italic">"{selectedLead.lastMessage}"</p>
                                <p className="text-xs text-gray-400 mt-2 text-right">{new Date(selectedLead.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex w-[400px] bg-gray-50 rounded-2xl border border-gray-200 border-dashed items-center justify-center text-gray-400 p-8 text-center">
                        <p>Selecione um lead para ver os detalhes</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Editar Lead</h3>
                        <form onSubmit={handleUpdateLead} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    {Object.entries(statusMap).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Anotações</label>
                                <textarea
                                    value={editForm.notes}
                                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                    rows={4}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="Escreva detalhes sobre a negociação..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
