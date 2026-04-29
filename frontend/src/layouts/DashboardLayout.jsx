import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, MessageCircle, TrendingUp, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/dashboard/members', icon: Users, label: 'Members' },
        { path: '/dashboard/follow-up', icon: MessageCircle, label: 'Follow-Up' },
        { path: '/dashboard/revenue', icon: TrendingUp, label: 'Revenue' },
        { path: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
        { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
        }
        return location.pathname.startsWith(path);
    };

    // Subscription Guard
    if (user?.role === 'owner' && user?.planStatus === 'EXPIRED' && location.pathname !== '/dashboard/subscription') {
        return <Navigate to="/dashboard/subscription" replace />;
    }

    // Reminder Logic
    let showReminder = false;
    let daysUntilExpiry = null;
    let formattedExpiryDate = null;
    if (user?.planExpiryDate && user?.planStatus !== 'EXPIRED') {
        const expiry = new Date(user.planExpiryDate);
        const today = new Date();
        const diffTime = expiry - today;
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 2 && daysUntilExpiry >= 0) {
            showReminder = true;
            formattedExpiryDate = expiry.toLocaleDateString();
        }
    }

    return (
        <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
            {/* Sidebar overlay (mobile only) */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar drawer */}
            <aside className={`fixed top-0 left-0 h-full w-72 z-50 bg-[#0f0f1a]/95 backdrop-blur-xl border-r border-white/[0.07] transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-60 lg:w-64 md:flex-shrink-0 flex flex-col overflow-hidden`}>
                {/* Premium glowing blobs */}
                <div className="absolute top-0 -left-20 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 -right-20 w-48 h-48 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 p-6 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        {user?.gymLogoUrl ? (
                            <img
                                src={user.gymLogoUrl}
                                alt="Gym Logo"
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-900/40 ring-2 ring-purple-500/20">
                                <Dumbbell size={20} className="text-white" />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">TrackON</h1>
                    </div>
                    {/* Close button — mobile only */}
                    <button 
                        className="md:hidden text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] transition-all"
                        onClick={() => setSidebarOpen(false)}
                    >✕</button>
                </div>

                <div className="relative z-10 p-4 flex-1 overflow-y-auto">
                    <div className="mb-6 px-4 py-3 bg-[#13131f] rounded-2xl border border-white/[0.07] shadow-inner">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Welcome</p>
                        <p className="font-semibold text-white text-sm truncate">{user?.ownerName}</p>
                    </div>

                    <nav className="space-y-1.5">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={isActive(item.path) 
                                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600/30 to-cyan-500/10 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-200 relative overflow-hidden' 
                                    : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-200 hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent transition-all duration-200 group'}
                            >
                                <item.icon size={18} className={isActive(item.path) ? 'text-purple-400 relative z-10' : 'text-gray-500 group-hover:text-purple-400 relative z-10 transition-colors'} />
                                <span className="relative z-10">{item.label}</span>
                                {isActive(item.path) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.5)] relative z-10"></span>}
                            </Link>
                        ))}
                    </nav>
                </div>
                
                <div className="relative z-10 p-4 border-t border-white/[0.07] bg-[#0f0f1a]/80 backdrop-blur-md">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition-all duration-200 active:scale-[0.98]">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen md:min-h-0 overflow-hidden">
                {/* MOBILE TOP NAV BAR */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-[#0f0f1a]/90 backdrop-blur-2xl shadow-[0_4px_30px_rgba(168,85,247,0.1)] sticky top-0 z-30">
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] text-gray-300 hover:bg-white/[0.10] transition-all"
                    >
                        <div className="space-y-1.5">
                            <div className="w-5 h-0.5 bg-current rounded-full"/>
                            <div className="w-4 h-0.5 bg-current rounded-full"/>
                            <div className="w-5 h-0.5 bg-current rounded-full"/>
                        </div>
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-900/30 ring-1 ring-purple-500/50">
                            <Dumbbell size={14} className="text-white" />
                        </div>
                        <span className="font-bold text-white text-sm tracking-tight">TrackON</span>
                    </div>
                    
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/40 to-cyan-600/40 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-white">
                        {user?.ownerName?.charAt(0) || 'G'}
                    </div>
                </header>

                {/* Reminder Banner */}
                {showReminder && (
                    <div className="bg-red-500/10 border-b border-red-500/25 p-3 text-center">
                        <p className="text-red-400 text-sm font-medium flex items-center justify-center gap-2">
                            <span className="text-red-500 text-lg">⚠️</span> Your plan will expire on {formattedExpiryDate}!
                            <Link to="/dashboard/subscription" className="ml-2 px-3 py-1 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all font-bold text-red-300">Renew Now</Link>
                        </p>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto">
                    <div className={`mx-auto pb-24 md:pb-8 max-w-7xl ${location.pathname.includes('/dashboard/members') ? '' : 'p-4 sm:p-6 md:p-8'}`}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="h-full w-full"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
