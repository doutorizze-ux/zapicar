
import { Car, MessageSquare, Users, MousePointerClick, Plus, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
    { label: 'Veículos Ativos', value: '12', icon: Car, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2 essa semana' },
    { label: 'Mensagens', value: '1,234', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50', trend: '+12% vs mês anterior' },
    { label: 'Leads Totais', value: '89', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '5 novos hoje' },
    { label: 'Cliques no Bot', value: '432', icon: MousePointerClick, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+8%' },
];

export function DashboardHome() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta! 👋</h1>
                    <p className="text-gray-300 max-w-xl">
                        Aqui está o que está acontecendo na sua loja hoje. Verifique seus leads recentes e gerencie seu estoque.
                    </p>
                    <div className="mt-6 flex gap-4">
                        <Link to="/dashboard/vehicles" className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Novo Veículo
                        </Link>
                        <Link to="/dashboard/whatsapp" className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/20 transition backdrop-blur-sm">
                            Ver Mensagens
                        </Link>
                    </div>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none">
                    <Zap className="w-96 h-96 -translate-y-1/3 translate-x-1/4" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-medium">{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity / Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Leads */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Leads Recentes</h3>
                        <Link to="/dashboard/whatsapp" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold shrink-0">
                                        L{i}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Novo Lead Interessado</p>
                                        <p className="text-sm text-gray-500">Olá, gostaria de saber mais sobre...</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">Há 2 horas</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Status */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Status da Loja</h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Plano Atual</span>
                                <Link to="/dashboard/plans" className="text-blue-600 font-medium text-xs hover:underline">Gerenciar</Link>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-700 rounded-lg font-bold text-center border border-purple-100">
                                Visualizar Planos
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Limite de Veículos</span>
                                <span className="text-gray-900 font-medium">0 / 50</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Limite de Mensagens</span>
                                <span className="text-gray-900 font-medium">0 / 5,000</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
