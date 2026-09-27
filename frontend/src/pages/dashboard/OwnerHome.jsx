import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, TrendingUp, ShoppingBag, Receipt, FileText, ArrowUpRight } from 'lucide-react';

const shortcuts = [
    { label: 'Members', detail: 'Manage your member base', icon: Users, path: '/dashboard/members', tone: 'from-indigo-500 to-violet-600' },
    { label: 'Follow up', detail: 'Keep conversations moving', icon: MessageCircle, path: '/dashboard/follow-up', tone: 'from-sky-500 to-cyan-500' },
    { label: 'Revenue', detail: 'View earnings and trends', icon: TrendingUp, path: '/dashboard/revenue', tone: 'from-emerald-500 to-teal-500' },
    { label: 'Store', detail: 'Products and sales', icon: ShoppingBag, path: '/dashboard/store', tone: 'from-fuchsia-500 to-pink-500' },
    { label: 'Billing', detail: 'Invoices and payments', icon: Receipt, path: '/dashboard/billing', tone: 'from-amber-500 to-orange-500' },
    { label: 'Plans', detail: 'Membership plans', icon: FileText, path: '/dashboard/plans', tone: 'from-rose-500 to-red-500' },
];

export default function OwnerHome() {
    const navigate = useNavigate();
    return <div className="mx-auto max-w-5xl">
        <div className="mb-6"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-500">Quick access</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Run your gym, simply.</h1><p className="mt-1 text-sm text-slate-500">Everything you need is one tap away.</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-3">
            {shortcuts.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => navigate(item.path)} className="group relative min-h-[154px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70 active:scale-[0.98] xl:min-h-[168px] xl:p-5">
                <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-lg`}><Icon size={23} /></span><h2 className="text-base font-extrabold text-slate-800">{item.label}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p><ArrowUpRight size={17} className="absolute bottom-4 right-4 text-slate-300 transition group-hover:text-indigo-500" />
            </button>; })}
        </div>
    </div>;
}
