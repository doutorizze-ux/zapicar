
import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Bot, User } from 'lucide-react';
import { API_URL } from '../config';
import { type Lead } from '../pages/LeadsPage';

interface Message {
    id: string;
    from: string;
    body: string;
    isBot: boolean;
    createdAt: string;
}

interface LeadChatModalProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
}

export function LeadChatModal({ lead, isOpen, onClose }: LeadChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchHistory = async () => {
        if (!lead || !isOpen) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/whatsapp/history?contactId=${lead.phone}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch chat history', error);
        } finally {
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [lead, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !lead || sending) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: lead.phone,
                    message: newMessage
                })
            });

            if (response.ok) {
                setNewMessage('');
                fetchHistory(); // Refresh
            } else {
                alert('Erro ao enviar mensagem. Verifique a conexão do WhatsApp.');
            }
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white w-full max-w-lg h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : <User />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{lead.name || 'Novo Lead'}</h3>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                {lead.phone}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                    {loading && messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                            <p className="text-sm">Carregando mensagens...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-sm max-w-[200px]">Nenhuma mensagem trocada ainda com este lead.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.from === 'me';
                            const isBot = msg.isBot || msg.from === 'bot';

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${isMe
                                        ? 'bg-green-600 text-white rounded-tr-none'
                                        : isBot
                                            ? 'bg-white border border-blue-100 text-gray-800 rounded-tl-none shadow-sm'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                                        }`}>
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                        <div className={`text-[10px] mt-2 flex items-center gap-1 opacity-60 ${isMe ? 'justify-end' : ''}`}>
                                            {isBot && <Bot className="w-3 h-3" />}
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite sua resposta..."
                            className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                        >
                            <Send className="w-5 h-5 translate-x-0.5 -translate-y-0.5" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center uppercase font-black tracking-widest">
                        Envia via WhatsApp Zapicar
                    </p>
                </form>
            </div>
        </div>
    );
}
