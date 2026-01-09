
import { motion } from 'framer-motion';
import { type Lead } from '../pages/LeadsPage';
import {
    MessageSquare, Phone,
    Car, Trash2,
    CheckCircle2, Clock,
    DollarSign, XCircle
} from 'lucide-react';

interface CRMBoardProps {
    leads: Lead[];
    onUpdateStatus: (id: string, status: string) => void;
    onDelete: (id: string) => void;
    onViewMessages?: (lead: Lead) => void;
}

const COLUMNS = [
    { id: 'NEW', title: 'Novos Leads', icon: Clock, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { id: 'IN_PROGRESS', title: 'Em Negociação', icon: MessageSquare, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
    { id: 'WAITING_FINANCIAL', title: 'Financiamento', icon: DollarSign, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    { id: 'WON', title: 'Venda Feita', icon: CheckCircle2, color: 'bg-green-500', bgColor: 'bg-green-50' },
    { id: 'LOST', title: 'Perdidos', icon: XCircle, color: 'bg-gray-500', bgColor: 'bg-gray-50' },
];

export function CRMBoard({ leads, onUpdateStatus, onDelete, onViewMessages }: CRMBoardProps) {

    const getLeadsByStatus = (status: string) => leads.filter(l => (l.status || 'NEW') === status);

    const formatPhone = (phone: string) => {
        if (phone.length < 10) return phone;
        const ddd = phone.substring(2, 4);
        const prefix = phone.substring(4, 9);
        const suffix = phone.substring(9);
        return `(${ddd}) ${prefix}-${suffix}`;
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-200">
            {COLUMNS.map(column => {
                const columnLeads = getLeadsByStatus(column.id);

                return (
                    <div key={column.id} className="flex-shrink-0 w-80">
                        <div className={`mb-4 p-3 rounded-xl ${column.bgColor} border border-gray-100 flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                                <column.icon className={`w-4 h-4 text-white p-0.5 rounded ${column.color}`} />
                                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">{column.title}</h3>
                            </div>
                            <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-gray-400 shadow-sm border border-gray-100">
                                {columnLeads.length}
                            </span>
                        </div>

                        <div className="space-y-3 min-h-[500px]">
                            {columnLeads.map(lead => (
                                <motion.div
                                    key={lead.id}
                                    layout
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                                                {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm truncate max-w-[120px]">{lead.name || 'Desconhecido'}</p>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <Phone className="w-2.5 h-2.5" />
                                                    {formatPhone(lead.phone)}
                                                </div>
                                            </div>
                                        </div>
                                        {lead.isHot && (
                                            <span className="bg-red-50 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-red-100 uppercase animate-pulse">
                                                Hot
                                            </span>
                                        )}
                                    </div>

                                    {lead.interestSubject && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg w-fit mb-3">
                                            <Car className="w-3 h-3" />
                                            {lead.interestSubject}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 bg-gray-50 p-2 rounded-lg italic">
                                        "{lead.lastMessage || 'Sem mensagem...'}"
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onViewMessages?.(lead)}
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                title="Ver Mensagens"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                            </button>
                                            <a
                                                href={`https://wa.me/${lead.phone}`}
                                                target="_blank"
                                                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Abrir no WhatsApp"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                                onClick={() => onDelete(lead.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-red-100"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="relative group/tabs">
                                            <select
                                                className="text-[10px] font-bold text-gray-400 bg-gray-50 border-none rounded-lg py-1 px-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                                                value={lead.status || 'NEW'}
                                                onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                                            >
                                                {COLUMNS.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {columnLeads.length === 0 && (
                                <div className="border-2 border-dashed border-gray-100 rounded-2xl h-32 flex items-center justify-center">
                                    <p className="text-[10px] font-bold text-gray-300 uppercase">Vazio</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
