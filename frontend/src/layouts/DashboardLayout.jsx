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
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar overlay (mobile only) */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar drawer */}
            <aside className={`fixed top-0 left-0 h-full w-72 z-50 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-60 lg:w-64 md:flex-shrink-0 flex flex-col overflow-hidden`}>

                <div className="relative z-10 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {user?.gymLogoUrl ? (
                            <img
                                src={user.gymLogoUrl}
                                alt="Gym Logo"
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-100 shadow-sm"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                                <Dumbbell size={20} className="text-white" />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">TrackON</h1>
                    </div>
                    {/* Close button — mobile only */}
                    <button
                        className="md:hidden text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 transition-all"
                        onClick={() => setSidebarOpen(false)}
                    >✕</button>
                </div>

                <div className="relative z-10 p-4 flex-1 overflow-y-auto">
                    <div className="mb-6 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Welcome</p>
                        <p className="font-semibold text-slate-800 text-sm truncate">{user?.gymName}</p>
                    </div>

                    <nav className="space-y-1.5">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={isActive(item.path)
                                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 transition-all duration-200 relative overflow-hidden'
                                    : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent transition-all duration-200 group'}
                            >
                                <item.icon size={18} className={isActive(item.path) ? 'text-indigo-600 relative z-10' : 'text-slate-400 group-hover:text-indigo-600 relative z-10 transition-colors'} />
                                <span className="relative z-10">{item.label}</span>
                                {isActive(item.path) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 relative z-10"></span>}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="relative z-10 p-4 border-t border-slate-100">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-200 active:scale-[0.98]">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen md:min-h-0 overflow-hidden">
                {/* MOBILE TOP NAV BAR */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shadow-sm sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                    >
                        <div className="space-y-1.5">
                            <div className="w-5 h-0.5 bg-current rounded-full" />
                            <div className="w-4 h-0.5 bg-current rounded-full" />
                            <div className="w-5 h-0.5 bg-current rounded-full" />
                        </div>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                            <Dumbbell size={14} className="text-white" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm tracking-tight">{user?.gymName}</span>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {user?.ownerName?.charAt(0) || 'G'}
                    </div>
                </header>

                {/* Reminder Banner */}
                {showReminder && (
                    <div className="bg-amber-50 border-b border-amber-200 p-3 text-center">
                        <p className="text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
                            <span className="text-amber-500 text-lg">⚠️</span> Your plan will expire on {formattedExpiryDate}!
                            <Link to="/dashboard/subscription" className="ml-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all font-semibold text-sm">Renew Now</Link>
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
