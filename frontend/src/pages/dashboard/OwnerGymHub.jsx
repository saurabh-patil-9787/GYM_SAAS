import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Settings, CreditCard, KeyRound, Bell, LogOut, ChevronRight, Building2 } from 'lucide-react';

export default function OwnerGymHub() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const actions = [
        { label: 'Gym settings', description: 'Branding, details and preferences', icon: Settings, path: '/dashboard/settings', color: 'text-indigo-600 bg-indigo-50' },
        { label: 'Subscription', description: 'Manage your current plan', icon: CreditCard, path: '/dashboard/subscription', color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Password resets', description: 'Review member reset requests', icon: KeyRound, path: '/dashboard/password-resets', color: 'text-amber-600 bg-amber-50' },
        { label: 'Notifications', description: 'Member alerts and updates', icon: Bell, path: '/dashboard/notifications', color: 'text-fuchsia-600 bg-fuchsia-50' },
    ];
    return <div className="mx-auto max-w-2xl"><div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-500">Your workspace</p><h1 className="mt-1 text-2xl font-black tracking-tight">My Gym</h1></div>
        <div className="mb-5 flex items-center gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-xl shadow-indigo-200"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/25">{user?.gymLogoUrl ? <img src={user.gymLogoUrl} alt="Gym" className="h-full w-full object-cover" /> : <Building2 size={27} />}</div><div className="min-w-0"><p className="truncate text-lg font-extrabold">{user?.gymName || 'My Gym'}</p><p className="mt-0.5 text-sm text-indigo-100">{user?.ownerName || user?.email || 'Gym owner'}</p></div></div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{actions.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => navigate(item.path)} className="flex w-full items-center gap-4 border-b border-slate-100 p-4 text-left transition last:border-0 hover:bg-slate-50"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.color}`}><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-800">{item.label}</span><span className="block truncate text-xs text-slate-500">{item.description}</span></span><ChevronRight size={19} className="text-slate-300" /></button>; })}</div>
        <button onClick={logout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-extrabold text-rose-600 transition hover:bg-rose-100"><LogOut size={18} /> Log out</button>
    </div>;
}
