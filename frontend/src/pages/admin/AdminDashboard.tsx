
import { Users, DollarSign, Package } from 'lucide-react';

export function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Master</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Usuários Ativos</p>
                        <p className="text-2xl font-bold text-gray-900">1,234</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Receita Mensal</p>
                        <p className="text-2xl font-bold text-gray-900">R$ 45.320</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Planos Ativos</p>
                        <p className="text-2xl font-bold text-gray-900">3</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
