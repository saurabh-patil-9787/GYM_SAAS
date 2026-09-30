import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    AlertCircle, CalendarDays, ChevronDown, CreditCard,
    IndianRupee, SlidersHorizontal, TrendingDown, TrendingUp, Wallet, X
} from 'lucide-react';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import { useAuth } from '../../context/AuthContext';


// "This month" removed — visible directly on the card
const periods = [
    { key: 'today', label: 'Today' },
    { key: 'last_month', label: 'Last month' },
    { key: 'this_year', label: 'This year' },
    { key: 'last_year', label: 'Last year' },
    { key: 'all_time', label: 'All time' },
    { key: 'custom', label: 'Custom range' },
];

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dateForInput = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// ─── Gradient Summary Cards ─────────────────────────────────────────────────
const cardThemes = {
    emerald: {
        gradient: 'from-[#047857] via-[#059669] to-[#14b8a6]',
        shadow: 'shadow-xl shadow-emerald-200/70',
        hover: 'sm:hover:shadow-2xl sm:hover:shadow-emerald-300/60',
    },
    violet: {
        gradient: 'from-[#4338ca] via-[#6d28d9] to-[#7c3aed]',
        shadow: 'shadow-xl shadow-violet-200/70',
        hover: 'sm:hover:shadow-2xl sm:hover:shadow-violet-300/60',
    },
    amber: {
        gradient: 'from-[#b45309] via-[#d97706] to-[#f59e0b]',
        shadow: 'shadow-xl shadow-amber-200/70',
        hover: 'sm:hover:shadow-2xl sm:hover:shadow-amber-300/60',
    },
    rose: {
        gradient: 'from-[#be123c] via-[#e11d48] to-[#fb7185]',
        shadow: 'shadow-xl shadow-rose-200/70',
        hover: 'sm:hover:shadow-2xl sm:hover:shadow-rose-300/60',
    },
};

function SummaryCard({ icon: Icon, BgIcon, label, sublabel, value, theme }) {
    const t = cardThemes[theme] || cardThemes.emerald;
    return (
        <article className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${t.gradient} ${t.shadow} ${t.hover} transition-all duration-500 hover:-translate-y-0.5 p-4 sm:p-5 flex flex-col justify-between min-h-[148px]`}>
            {/* Glow blob */}
            <div className="absolute -top-14 -right-14 w-32 h-32 rounded-full bg-white blur-[55px] opacity-20" />
            {/* Watermark icon */}
            {BgIcon && <BgIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-[0.10] pointer-events-none" />}
            {/* Top row */}
            <div className="relative z-10 flex items-start justify-between">
                <div className="p-2.5 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm shadow-sm">
                    {Icon && <Icon className="w-5 h-5 text-white" />}
                </div>
                {sublabel && (
                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/15 border-white/20 text-white whitespace-nowrap">
                        {sublabel}
                    </span>
                )}
            </div>
            {/* Bottom content */}
            <div className="relative z-10 mt-3">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/80 leading-tight truncate">{label}</p>
                <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-white leading-none truncate">{money(value)}</p>
            </div>
        </article>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function RevenuePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('this_year');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCustomOpen, setIsCustomOpen] = useState(false);

    // Staff without revenue permission are redirected immediately
    if (user?.role === 'staff' && user?.canViewRevenue === false) {
        return <Navigate to="/dashboard/home" replace />;
    }

    const [customDates, setCustomDates] = useState(() => ({
        startDate: dateForInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        endDate: dateForInput(new Date()),
    }));
    const [revenueData, setRevenueData] = useState({
        todayCollection: 0, thisMonthCollection: 0, lastMonthCollection: 0,
        totalPendingDues: 0, selectedCollection: 0, selectedLabel: 'This year',
        transactionCount: 0, recentTransactions: [],
    });

    const fetchRevenueStats = async (selectedPeriod = period, dates = customDates) => {
        if (!loading) setIsRefreshing(true);
        setError(null);
        try {
            const params = { period: selectedPeriod };
            if (selectedPeriod === 'custom') Object.assign(params, dates);
            const res = await api.get('/api/analytics/revenue', { params });
            if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response');
            setRevenueData(res.data);
        } catch (err) {
            console.error('Error fetching revenue stats:', err);
            setError('Unable to load revenue data. Please try again.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchRevenueStats(); }, []);

    const selectPeriod = key => {
        setIsFilterOpen(false);
        if (key === 'custom') return setIsCustomOpen(true);
        setPeriod(key);
        fetchRevenueStats(key);
    };

    const applyCustomRange = event => {
        event.preventDefault();
        if (customDates.startDate > customDates.endDate) return;
        setPeriod('custom');
        setIsCustomOpen(false);
        fetchRevenueStats('custom', customDates);
    };

    const activePeriod = periods.find(item => item.key === period)?.label || 'This year';
    const transactions = revenueData.recentTransactions || [];

    // Dynamic month names
    const now = new Date();
    const currentMonthFull = now.toLocaleDateString('en-IN', { month: 'long' });
    const currentMonthShort = now.toLocaleDateString('en-IN', { month: 'short' });
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthFull = lastMonthDate.toLocaleDateString('en-IN', { month: 'long' });
    const lastMonthShort = lastMonthDate.toLocaleDateString('en-IN', { month: 'short' });

    return (
        <div className="mx-auto w-full max-w-6xl pb-8">

            {/* ── Four Summary Cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <SummaryCard icon={TrendingUp} BgIcon={TrendingUp} label="Collected Today" sublabel="Live" value={revenueData.todayCollection} theme="emerald" />
                <SummaryCard icon={CalendarDays} BgIcon={CalendarDays} label="Current Month" sublabel={currentMonthShort} value={revenueData.thisMonthCollection} theme="violet" />
                <SummaryCard icon={Wallet} BgIcon={Wallet} label="Amount Pending" sublabel="Dues" value={revenueData.totalPendingDues} theme="amber" />
                <SummaryCard icon={TrendingDown} BgIcon={TrendingDown} label="Last Month" sublabel={lastMonthShort} value={revenueData.lastMonthCollection} theme="rose" />
            </div>

            {/* ── Selected Collection Panel ── */}
            <section className="relative mt-4 sm:mt-5 overflow-visible rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-4 sm:p-5 shadow-lg shadow-indigo-200/60 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm shrink-0">
                            <IndianRupee className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-indigo-100 leading-tight">Selected Collection</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">{money(revenueData.selectedCollection)}</p>
                                {isRefreshing && <span className="text-xs font-bold text-indigo-200 animate-pulse">updating…</span>}
                            </div>
                            <p className="text-xs text-indigo-200 font-medium mt-0.5">
                                {revenueData.transactionCount || 0} payment{revenueData.transactionCount === 1 ? '' : 's'} · {activePeriod}
                            </p>
                        </div>
                    </div>
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsFilterOpen(v => !v)}
                            className="flex min-h-10 items-center gap-2 rounded-2xl bg-white px-3 sm:px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                            aria-expanded={isFilterOpen}
                        >
                            <SlidersHorizontal size={15} />
                            <span className="hidden xs:inline sm:inline">{activePeriod}</span>
                            <ChevronDown size={15} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 text-slate-700 shadow-2xl">
                                {periods.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => selectPeriod(item.key)}
                                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${period === item.key ? 'bg-indigo-50 text-indigo-700' : ''}`}
                                    >
                                        {item.label}
                                        {period === item.key && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Error Banner ── */}
            {error && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                    <span className="flex items-center gap-2"><AlertCircle size={18} />{error}</span>
                    <button onClick={() => fetchRevenueStats()} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white">Retry</button>
                </div>
            )}

            {/* ── Recent Cashflow ── */}
            <section className="mt-4 sm:mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-2.5 text-indigo-600">
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-800 text-sm sm:text-base">Recent Cashflow</h2>
                            <p className="text-xs text-slate-400 font-medium">Your latest payments</p>
                        </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{transactions.length} shown</span>
                </div>
                {loading ? (
                    <div className="p-10"><BicepCurlLoader text="Updating collection..." fullScreen={false} /></div>
                ) : transactions.length === 0 ? (
                    <div className="p-10 text-center">
                        <CreditCard className="mx-auto mb-3 text-slate-300" size={30} />
                        <p className="font-bold text-slate-600">No payments yet</p>
                        <p className="mt-1 text-xs text-slate-400">Payments will appear here when recorded.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {transactions.map((tx, index) => (
                            <article key={tx._id || index} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-black text-indigo-600">
                                    {tx.memberName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-extrabold text-slate-800">{tx.memberName || 'Member removed'}</p>
                                    <p className="mt-0.5 text-xs text-slate-400 font-medium">
                                        {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {tx.type || 'Cash'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm sm:text-base font-black text-emerald-600">+{money(tx.amount)}</p>
                                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{tx.transactionCategory || 'payment'}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Custom Date Modal ── */}
            {isCustomOpen && (
                <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
                    <form onSubmit={applyCustomRange} className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800">Custom date range</h2>
                                <p className="mt-1 text-xs text-slate-400">Show collection between two dates.</p>
                            </div>
                            <button type="button" onClick={() => setIsCustomOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={19} /></button>
                        </div>
                        <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Start date
                            <input required type="date" value={customDates.startDate} max={customDates.endDate}
                                onChange={e => setCustomDates(d => ({ ...d, startDate: e.target.value }))}
                                className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500" />
                        </label>
                        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            End date
                            <input required type="date" value={customDates.endDate} min={customDates.startDate} max={dateForInput(new Date())}
                                onChange={e => setCustomDates(d => ({ ...d, endDate: e.target.value }))}
                                className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500" />
                        </label>
                        <button type="submit" className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
                            Apply range
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
