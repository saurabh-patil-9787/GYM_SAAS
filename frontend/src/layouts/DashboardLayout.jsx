import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, MessageCircle } from 'lucide-react';

const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/dashboard/members', icon: Users, label: 'Members' },
        { path: '/dashboard/follow-up', icon: MessageCircle, label: 'Follow-Up' },
        // { path: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
        { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {user?.gymLogoUrl ? (
                            <img
                                src={user.gymLogoUrl}
                                alt="Gym Logo"
                                className="w-10 h-10 rounded-md object-cover bg-gray-700"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-purple-400 font-bold">
                                G
                            </div>
                        )}
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">TrackON</h1>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white"><X /></button>
                </div>

                <div className="p-4">
                    <div className="mb-6 px-4 py-3 bg-gray-700/50 rounded-xl border border-gray-700">
                        <p className="text-sm text-gray-400">Welcome,</p>
                        <p className="font-semibold truncate">{user?.ownerName}</p>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path) ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        ))}

                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors mt-8">
                            <LogOut size={20} />
                            Logout
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10 md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-100 p-2"><Menu /></button>
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
