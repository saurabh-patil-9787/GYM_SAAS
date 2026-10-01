import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Building2, Bell, Dumbbell, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OwnerToastNotifications from '../components/OwnerToastNotifications';
import { OwnerRealtimeProvider } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { requestNotificationPermission, getNotificationStatus, isFirebaseConfigured } from '../utils/firebase';
import { isAndroidApp } from '../utils/platformUtils';
import { initializeCapacitorFCM, registerAndroidFCMToken, setupCapacitorFCMListeners } from '../utils/capacitorFCM';

const DashboardLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [previewImage, setPreviewImage] = useState(null);
    const [notifStatus, setNotifStatus] = useState(() => getNotificationStatus());
    const [notifRequesting, setNotifRequesting] = useState(false);
    const [notifBannerDismissed, setNotifBannerDismissed] = useState(() => { try { return localStorage.getItem('ownerNotifBannerDismissed') === 'true'; } catch { return false; } });

    useEffect(() => {
        if (isAndroidApp()) {
            (async () => { try { await initializeCapacitorFCM(); await registerAndroidFCMToken('owner'); await setupCapacitorFCMListeners(); } catch (err) { console.warn('[DashboardLayout] Native FCM setup error:', err); } })();
        } else {
            const status = getNotificationStatus(); setNotifStatus(status);
            if (status === 'granted' && isFirebaseConfigured()) requestNotificationPermission('/api/auth/fcm-token').catch(() => {});
        }
    }, []);
    useEffect(() => {
        const params = new URLSearchParams(location.search); const notifId = params.get('notifId'); const action = params.get('action');
        if (/^[0-9a-fA-F]{24}$/.test(notifId || '') && action) api.put(`/api/notifications/public/${notifId}/status`, { status: action }).then(() => navigate(location.pathname, { replace: true })).catch(() => {});
    }, [location.search, location.pathname, navigate]);
    const handleEnableNotifications = async () => { setNotifRequesting(true); await requestNotificationPermission('/api/auth/fcm-token'); setNotifStatus(getNotificationStatus()); setNotifRequesting(false); };
    const dismissBanner = () => { try { localStorage.setItem('ownerNotifBannerDismissed', 'true'); } catch {} setNotifBannerDismissed(true); };
    if (user?.role === 'owner' && user?.planStatus === 'EXPIRED' && location.pathname !== '/dashboard/subscription') return <Navigate to="/dashboard/subscription" replace />;

    const expiry = user?.planExpiryDate ? new Date(user.planExpiryDate) : null;
    const daysUntilExpiry = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null;
    const showReminder = user?.planStatus !== 'EXPIRED' && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 2;
    const myGymPaths = ['/dashboard/my-gym', '/dashboard/settings', '/dashboard/subscription', '/dashboard/password-resets', '/dashboard/notifications'];
    const homePaths = ['/dashboard/home', '/dashboard/members', '/dashboard/member-history', '/dashboard/follow-up', '/dashboard/revenue', '/dashboard/store', '/dashboard/billing', '/dashboard/plans', '/dashboard/support-staff'];
    const activeTab = myGymPaths.some(path => location.pathname.startsWith(path)) ? 'gym' : homePaths.some(path => location.pathname.startsWith(path)) ? 'home' : 'dashboard';
    const tabs = [{ key: 'home', path: '/dashboard/home', label: 'Home', icon: Home }, { key: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { key: 'gym', path: '/dashboard/my-gym', label: 'My Gym', icon: Building2 }];

    return <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <button onClick={() => user?.gymLogoUrl && setPreviewImage({ url: user.gymLogoUrl, title: user.gymName })} className="flex min-w-0 items-center gap-3 text-left">
                {user?.gymLogoUrl ? <img src={user.gymLogoUrl} alt="Gym logo" className="h-10 w-10 rounded-2xl object-cover ring-2 ring-indigo-100 shadow-sm" /> : <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200"><Dumbbell size={20} /></span>}
                <span className="min-w-0"><span className="block truncate text-sm font-extrabold tracking-tight sm:text-base">{user?.gymName || 'My Gym'}</span><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Owner portal</span></span>
            </button><button onClick={() => navigate('/dashboard/notifications')} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600" aria-label="Notifications"><Bell size={19} /></button>
        </div></header>
        {!notifBannerDismissed && notifStatus !== 'granted' && notifStatus !== 'unsupported' && <div className={`border-b px-4 py-3 ${notifStatus === 'denied' ? 'border-amber-200 bg-amber-50' : 'border-indigo-100 bg-indigo-50'}`}><div className="mx-auto flex max-w-7xl items-start gap-3 text-sm"><Bell className={notifStatus === 'denied' ? 'mt-0.5 text-amber-600' : 'mt-0.5 text-indigo-600'} size={18} /><div className="flex-1"><p className="font-bold">{notifStatus === 'denied' ? 'Notifications are blocked' : 'Stay up to date with your gym'}</p><p className="mt-0.5 text-xs text-slate-600">{notifStatus === 'denied' ? 'Allow notifications in browser settings for member and payment alerts.' : 'Get instant alerts for new members, payments and renewals.'}</p>{notifStatus !== 'denied' && <button onClick={handleEnableNotifications} disabled={notifRequesting} className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">{notifRequesting ? 'Enabling...' : 'Enable notifications'}</button>}</div><button onClick={dismissBanner} className="rounded-lg p-1 text-slate-400 hover:bg-white" aria-label="Dismiss"><X size={16} /></button></div></div>}
        {showReminder && <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-900">Your subscription expires on {expiry.toLocaleDateString('en-GB')}. <Link to="/dashboard/subscription" className="ml-1 font-extrabold text-amber-700 underline">Renew now</Link></div>}
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-3 pb-24 pt-4 sm:px-6 sm:pt-7 lg:px-8"><AnimatePresence mode="wait"><motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}><Outlet /></motion.div></AnimatePresence></main>
        <button onClick={() => navigate('/dashboard/members?add=true')} className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-300/60 transition hover:scale-105 active:scale-95 sm:bottom-7 sm:right-8" title="Add member"><Plus size={25} /></button>
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/90 bg-white/95 px-2 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl shadow-[0_-6px_20px_rgba(15,23,42,0.05)]"><div className="mx-auto flex max-w-sm items-center justify-around">{tabs.map(tab => { const Icon = tab.icon; const selected = activeTab === tab.key; return <Link key={tab.key} to={tab.path} className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-bold transition ${selected ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}><span className={`flex h-8 w-9 items-center justify-center rounded-lg transition ${selected ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : ''}`}><Icon size={18} strokeWidth={selected ? 2.6 : 2} /></span>{tab.label}</Link>; })}</div></nav>
        {previewImage && <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/90 p-4"><img onClick={e => e.stopPropagation()} src={previewImage.url} alt={previewImage.title} className="max-h-[80vh] max-w-full rounded-2xl object-contain" /><p className="mt-4 font-semibold text-white">{previewImage.title}</p></div>}
        <OwnerToastNotifications />
    </div>;
};
export default function DashboardLayoutWithRealtime() { return <OwnerRealtimeProvider><DashboardLayout /></OwnerRealtimeProvider>; }
