
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, CreditCard, LogOut, Package } from 'lucide-react';

export function AdminLayout() {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    if (!user || !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white fixed h-full z-10 hidden md:block">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
                    <span className="font-bold text-lg">ZapAdmin</span>
                </div>

                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </button>

                    <button
                        onClick={() => navigate('/admin/users')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <Users className="w-5 h-5" />
                        Usuários
                    </button>

                    <button
                        onClick={() => navigate('/admin/plans')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <Package className="w-5 h-5" />
                        Planos
                    </button>

                    <button
                        onClick={() => navigate('/admin/financial')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <CreditCard className="w-5 h-5" />
                        Financeiro
                    </button>
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
}
