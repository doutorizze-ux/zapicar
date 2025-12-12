import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { MessageSquare, Send, User, PauseCircle, PlayCircle, Smartphone } from 'lucide-react';

interface ChatMessage {
    id: string;
    from: string;
    body: string;
    timestamp: number;
    senderName: string;
    isBot: boolean;
}

interface Contact {
    id: string;
    name: string;
    lastMessage?: string;
    lastTime?: number;
    unread?: number;
}

export function LiveChatPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [botPaused, setBotPaused] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    useEffect(() => { scrollToBottom(); }, [messages]);

    // Fetch contacts on mount
    useEffect(() => {
        fetchContacts();
        fetchPauseStatus();
    }, []);

    const fetchContacts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/whatsapp/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setContacts(data.map((c: any) => ({
                        id: c.id,
                        name: c.name || c.id,
                        lastMessage: c.lastMessage,
                        lastTime: new Date(c.lastTime).getTime() / 1000,
                        unread: 0
                    })));
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchPauseStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/whatsapp/pause-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setBotPaused((await res.json()).paused);
        } catch (e) { }
    };

    // Load chat history when contact is selected
    useEffect(() => {
        if (!activeContactId) {
            setMessages([]);
            return;
        }

        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/whatsapp/history?contactId=${activeContactId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const history = await res.json();
                    console.log('[LiveChat] Loaded history:', history);
                    setMessages(history.map((h: any) => ({
                        id: h.id,
                        from: h.from,
                        body: h.body,
                        timestamp: new Date(h.createdAt).getTime() / 1000,
                        senderName: h.senderName,
                        isBot: h.isBot
                    })));
                }
            } catch (e) { console.error(e); }
        };
        fetchHistory();
    }, [activeContactId]);

    // WebSocket connection
    useEffect(() => {
        let socketUrl = API_URL;
        if (socketUrl.startsWith('/')) {
            socketUrl = window.location.origin;
        } else {
            socketUrl = socketUrl.replace('/api', '');
        }

        const newSocket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('[LiveChat] Socket Connected');
            setIsConnected(true);
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${API_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(r => r.json())
                    .then(user => {
                        console.log('[LiveChat] Joining room:', user.id);
                        newSocket.emit('join_room', { userId: user.id });
                    });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('[LiveChat] Socket Disconnected');
            setIsConnected(false);
        });

        newSocket.on('new_message', (rawMsg: ChatMessage) => {
            console.log('[LiveChat] New message received:', rawMsg);

            // Clean the phone number
            const cleanFrom = rawMsg.from.replace(/@c\.us|@g\.us/g, '');
            const msg = { ...rawMsg, from: cleanFrom };

            // Update contacts list
            setContacts(prev => {
                // For bot messages, we don't know which contact unless we track it
                // For customer messages, use the from field
                const contactId = msg.isBot ? activeContactId : cleanFrom;
                if (!contactId) return prev;

                const exists = prev.find(c => c.id === contactId);
                const updatedContact = {
                    id: contactId,
                    name: exists ? exists.name : (msg.senderName || contactId),
                    lastMessage: msg.body,
                    lastTime: msg.timestamp,
                    unread: 0
                };

                const others = prev.filter(c => c.id !== contactId);
                return [updatedContact, ...others];
            });

            // Add to messages if this chat is open
            setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === msg.id)) {
                    console.log('[LiveChat] Duplicate message, ignoring');
                    return prev;
                }

                console.log('[LiveChat] Adding message to list');
                return [...prev, msg];
            });
        });

        setSocket(newSocket);
        return () => {
            console.log('[LiveChat] Disconnecting socket');
            newSocket.disconnect();
        };
    }, []);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeContactId) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ to: activeContactId, message: inputText })
            });
            setInputText('');
        } catch (e) {
            alert('Erro ao enviar');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex bg-white h-[calc(100vh-100px)] rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" /> Conversas
                    </h2>
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                        title={isConnected ? 'Online' : 'Offline'}></div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {contacts.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Nenhuma conversa encontrada.</div>
                    ) : (
                        contacts.map(contact => (
                            <div key={contact.id}
                                onClick={() => setActiveContactId(contact.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${activeContactId === contact.id ? 'bg-white border-l-4 border-l-green-500 shadow-sm' : ''
                                    }`}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-gray-800 truncate max-w-[140px]">{contact.name}</span>
                                    {contact.lastTime && (
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(contact.lastTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500 truncate max-w-[180px]">{contact.lastMessage || '...'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#E5DDD5]">
                {/* Header */}
                <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        {activeContactId ? (
                            <>
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                    {contacts.find(c => c.id === activeContactId)?.name?.charAt(0) || <User />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">
                                        {contacts.find(c => c.id === activeContactId)?.name || activeContactId}
                                    </h3>
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <Smartphone className="w-3 h-3" /> WhatsApp Web
                                    </p>
                                </div>
                            </>
                        ) : <h3 className="text-gray-500 italic">Selecione uma conversa</h3>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={async () => {
                            const newState = !botPaused;
                            const token = localStorage.getItem('token');
                            await fetch(`${API_URL}/whatsapp/pause`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ paused: newState })
                            });
                            setBotPaused(newState);
                        }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${botPaused ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                            {botPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                            {botPaused ? 'RETOMAR IA' : 'PAUSAR IA'}
                        </button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] pointer-events-none"></div>
                    {!activeContactId ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                            <Smartphone className="w-16 h-16 mb-4" />
                            <p>Selecione um contato para monitorar.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            // Message is from bot/agent if isBot is true OR from is 'me' or 'bot'
                            const isFromBot = msg.isBot || msg.from === 'me' || msg.from === 'bot';

                            return (
                                <div key={msg.id} className={`flex ${isFromBot ? 'justify-end' : 'justify-start'} relative z-10`}>
                                    <div className={`max-w-[70%] rounded-lg p-3 shadow-sm text-sm ${isFromBot
                                            ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none'
                                            : 'bg-white text-gray-800 rounded-tl-none'
                                        }`}>
                                        <p className={`text-xs font-bold mb-1 ${isFromBot ? 'text-gray-500' : 'text-orange-600'}`}>
                                            {msg.senderName || (isFromBot ? 'Atendente' : 'Cliente')}
                                        </p>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                                        <span className="text-[10px] text-gray-400 block text-right mt-1">
                                            {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-[#f0f2f5] border-t border-gray-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            disabled={!activeContactId || sending}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite uma mensagem..."
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-200"
                        />
                        <button onClick={handleSendMessage}
                            disabled={!activeContactId || sending || !inputText.trim()}
                            className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    {botPaused && activeContactId && (
                        <p className="text-xs text-yellow-600 mt-2 font-medium text-center flex items-center justify-center gap-1">
                            <PauseCircle className="w-3 h-3" />
                            A IA está pausada. Você está no controle total desta conversa.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
