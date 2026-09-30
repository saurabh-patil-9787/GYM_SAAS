import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { AlertCircle, CalendarDays, ChevronDown, Clock3, CreditCard, IndianRupee, SlidersHorizontal, WalletCards, X } from 'lucide-react';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const periods = [{ key: 'this_month', label: 'This month' }, { key: 'today', label: 'Today' }, { key: 'last_month', label: 'Last month' }, { key: 'this_year', label: 'This year' }, { key: 'last_year', label: 'Last year' }, { key: 'all_time', label: 'All time' }, { key: 'custom', label: 'Custom range' }];
const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dateForInput = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function SummaryCard({ icon: Icon, label, value, tone }) {
    const tones = { emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600', indigo: 'border-indigo-100 bg-indigo-50 text-indigo-600', amber: 'border-amber-100 bg-amber-50 text-amber-600', violet: 'border-violet-100 bg-violet-50 text-violet-600' };
    return <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4"><div className="flex items-center justify-between gap-2"><div className={`rounded-xl border p-2 ${tones[tone]}`}><Icon size={18} /></div><span className={`h-2 w-2 rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'}`} /></div><p className="mt-4 truncate text-[10px] font-extrabold tracking-wide text-slate-400 sm:text-xs">{label}</p><p className="mt-1 truncate text-xl font-black tracking-tight text-slate-800 sm:text-2xl">{money(value)}</p></article>;
}

export default function RevenuePage() {
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('this_year');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [customDates, setCustomDates] = useState(() => ({ startDate: dateForInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), endDate: dateForInput(new Date()) }));
    const [revenueData, setRevenueData] = useState({ todayCollection: 0, thisMonthCollection: 0, lastMonthCollection: 0, totalPendingDues: 0, selectedCollection: 0, selectedLabel: 'This month', transactionCount: 0, recentTransactions: [] });

    const fetchRevenueStats = async (selectedPeriod = period, dates = customDates) => {
        if (!loading) setIsRefreshing(true);
        setError(null);
        try {
            const params = { period: selectedPeriod };
            if (selectedPeriod === 'custom') Object.assign(params, dates);
            const res = await api.get('/api/analytics/revenue', { params });
            if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response');
            setRevenueData(res.data);
        } catch (err) { console.error('Error fetching revenue stats:', err); setError('Unable to load revenue data. Please try again.'); }
        finally { setLoading(false); setIsRefreshing(false); }
    };

    useEffect(() => { fetchRevenueStats(); }, []);
    const selectPeriod = key => { setIsFilterOpen(false); if (key === 'custom') return setIsCustomOpen(true); setPeriod(key); fetchRevenueStats(key); };
    const applyCustomRange = event => { event.preventDefault(); if (customDates.startDate > customDates.endDate) return; setPeriod('custom'); setIsCustomOpen(false); fetchRevenueStats('custom', customDates); };
    const activePeriod = periods.find(item => item.key === period)?.label || 'This year';
    const transactions = revenueData.recentTransactions || [];
    const currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'short' }).toLowerCase();
    const lastMonthName = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-IN', { month: 'short' }).toLowerCase();

    return <div className="mx-auto w-full max-w-6xl pb-8">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
            <SummaryCard icon={Clock3} label="Collected today" value={revenueData.todayCollection} tone="emerald" />
            <SummaryCard icon={CalendarDays} label={`this month · ${currentMonthName}`} value={revenueData.thisMonthCollection} tone="indigo" />
            <SummaryCard icon={WalletCards} label="Amount pending" value={revenueData.totalPendingDues} tone="amber" />
            <SummaryCard icon={CalendarDays} label={`last month · ${lastMonthName}`} value={revenueData.lastMonthCollection} tone="violet" />
        </div>

        <section className="relative mt-4 overflow-visible rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-lg shadow-indigo-200 sm:mt-5 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-indigo-100"><IndianRupee size={16} /><span className="text-xs font-bold uppercase tracking-wider">Selected collection</span></div><p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{money(revenueData.selectedCollection)}</p><p className="mt-1 text-xs font-medium text-indigo-100">{revenueData.transactionCount || 0} payment{revenueData.transactionCount === 1 ? '' : 's'} in this period</p></div><div className="relative"><button onClick={() => setIsFilterOpen(value => !value)} className="flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50" aria-expanded={isFilterOpen}><SlidersHorizontal size={16} /> {activePeriod} <ChevronDown size={16} /></button>{isFilterOpen && <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl">{periods.map(item => <button key={item.key} onClick={() => selectPeriod(item.key)} className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold hover:bg-indigo-50 ${period === item.key ? 'bg-indigo-50 text-indigo-700' : ''}`}>{item.label}{period === item.key && <span className="h-2 w-2 rounded-full bg-indigo-600" />}</button>)}</div>}</div></div></section>
        {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><span className="flex items-center gap-2"><AlertCircle size={18} />{error}</span><button onClick={() => fetchRevenueStats()} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Retry</button></div>}
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-5"><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-2 text-indigo-600"><CreditCard size={19} /></div><div><h2 className="font-extrabold text-slate-800">Recent cashflow</h2><p className="text-xs text-slate-500">Your latest payments</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{transactions.length} shown</span></div>{loading ? <div className="p-10"><BicepCurlLoader text="Updating collection..." fullScreen={false} /></div> : transactions.length === 0 ? <div className="p-10 text-center"><CreditCard className="mx-auto mb-3 text-slate-300" size={30} /><p className="font-bold text-slate-600">No payments yet</p><p className="mt-1 text-xs text-slate-400">Payments will appear here when recorded.</p></div> : <div className="divide-y divide-slate-100">{transactions.map((tx, index) => <article key={tx._id || index} className="flex items-center gap-3 px-4 py-3.5 sm:px-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500">{tx.memberName?.charAt(0)?.toUpperCase() || '?'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800">{tx.memberName || 'Member removed'}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {tx.type || 'Cash'}</p></div><div className="text-right"><p className="text-base font-black text-emerald-600">+{money(tx.amount)}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{tx.transactionCategory || 'payment'}</p></div></article>)}</div>}</section>
        {isCustomOpen && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"><form onSubmit={applyCustomRange} className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-800">Custom date range</h2><p className="mt-1 text-xs text-slate-500">Show collection between two dates.</p></div><button type="button" onClick={() => setIsCustomOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={19} /></button></div><label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">Start date<input required type="date" value={customDates.startDate} max={customDates.endDate} onChange={e => setCustomDates(data => ({ ...data, startDate: e.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500" /></label><label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">End date<input required type="date" value={customDates.endDate} min={customDates.startDate} max={dateForInput(new Date())} onChange={e => setCustomDates(data => ({ ...data, endDate: e.target.value }))} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500" /></label><button type="submit" className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200">Apply range</button></form></div>}
    </div>;
}
