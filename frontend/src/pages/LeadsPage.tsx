
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, MessageSquare, Phone, Calendar, Plus, Trash2, Car, LayoutGrid, List, TrendingUp, DollarSign, Target } from 'lucide-react';
import { CRMBoard } from '../components/CRMBoard';
import { API_URL } from '../config';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { LeadChatModal } from '../components/LeadChatModal';

export interface Lead {
    id: string;
    phone: string;
    name?: string;
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
    isHot?: boolean;
    interestSubject?: string;
    status: string;
}

export function LeadsPage() {
    const { token } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'crm'>('crm');
    const [stats, setStats] = useState({
        totalLeads: 0,
        conversionRate: "0",
        openValue: 0,
        wonValue: 0,
        hotLeads: 0
    });

    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        fetchLeads();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/leads/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${API_URL}/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLeads(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`${API_URL}/leads/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                // Optimistic update or refetch
                setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
            }
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este lead?')) return;

        try {
            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchLeads();
            } else {
                alert('Erro ao excluir lead');
            }
        } catch (error) {
            console.error('Failed to delete lead', error);
        }
    };

    if (loading) return <div>Carregando...</div>;

    const formatPhone = (phone: string) => {
        // Simple formatter, can be improved lib later
        // 5511999999999 -> (11) 99999-9999
        if (phone.length < 10) return phone;
        const ddd = phone.substring(2, 4);
        const prefix = phone.substring(4, 9);
        const suffix = phone.substring(9);
        return `(${ddd}) ${prefix}-${suffix}`;
    };

    const getInitial = (name?: string) => {
        if (name) return name.charAt(0).toUpperCase();
        return '?';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CRM de Vendas</h1>
                    <p className="text-gray-500">Acompanhe o desempenho do seu funil e converta mais.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex gap-1">
                        <button
                            onClick={() => setViewMode('crm')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'crm' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Visualização em Funil"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Visualização em Lista"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Lead
                    </button>
                </div>
            </div>

            {/* Dashboard Mini Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg"><User className="w-5 h-5 text-blue-500" /></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Leads Totais</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{stats.totalLeads}</p>
                    <p className="text-xs text-green-600 font-bold mt-1">+{stats.hotLeads} Hot Leads</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg"><Target className="w-5 h-5 text-purple-500" /></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversão</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{stats.conversionRate}%</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">Status: Ganhos</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-yellow-50 rounded-lg"><TrendingUp className="w-5 h-5 text-yellow-600" /></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Aberto</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.openValue)}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-1">Valor potencial</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-50 rounded-lg"><DollarSign className="w-5 h-5 text-green-500" /></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faturado</span>
                    </div>
                    <p className="text-2xl font-black text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.wonValue)}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-1">Vendas concluídas</p>
                </div>
            </div>

            {viewMode === 'crm' ? (
                <CRMBoard
                    leads={leads}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                    onViewMessages={(lead) => {
                        setSelectedLead(lead);
                        setIsChatOpen(true);
                    }}
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-xs md:text-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Nome / Contato</th>
                                    <th className="px-6 py-4">Última Mensagem</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Telefone</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                                    {getInitial(lead.name)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900">{lead.name || 'Desconhecido'}</p>
                                                        {lead.isHot && (
                                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-full border border-red-100">
                                                                🔥 Hot
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-medium">ID: {lead.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 max-w-xs">
                                                {lead.interestSubject && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded w-fit mb-1 border border-green-100 uppercase tracking-tighter">
                                                        <Car className="w-3 h-3" />
                                                        {lead.interestSubject}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                    <span className="truncate text-gray-500 italic" title={lead.lastMessage}>
                                                        "{lead.lastMessage || '-'}"
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="text-[10px] font-bold text-gray-500 bg-gray-50 border-none rounded-lg py-1 px-2 outline-none cursor-pointer"
                                                value={lead.status || 'NEW'}
                                                onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                                            >
                                                <option value="NEW">Novo Lead</option>
                                                <option value="IN_PROGRESS">Negociando</option>
                                                <option value="WAITING_FINANCIAL">Financeiro</option>
                                                <option value="WON">Venda Feita</option>
                                                <option value="LOST">Perdido</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                <Phone className="w-4 h-4 text-gray-300" />
                                                {formatPhone(lead.phone)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-300" />
                                                <span className="font-medium">{new Date(lead.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLead(lead);
                                                        setIsChatOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-600/20 text-xs flex items-center gap-2"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    Ver Mensagens
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lead.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Excluir Lead"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {leads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                    <User className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="font-medium">Nenhum lead encontrado.</p>
                                                <p className="text-sm">Compartilhe seu link ou aguarde contatos no WhatsApp.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            <CreateLeadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchLeads();
                }}
            />

            <LeadChatModal
                isOpen={isChatOpen}
                lead={selectedLead}
                onClose={() => {
                    setIsChatOpen(false);
                    setSelectedLead(null);
                }}
            />
        </div>
    );
}
