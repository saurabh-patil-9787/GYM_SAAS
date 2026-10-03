import React, { useEffect, useState } from 'react';
import { ChevronLeft, CircleDollarSign, History, Search, UserRound } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { generateTransactionReceipt } from '../../utils/whatsappMessages';
import { normalizeWhatsAppNumber, openWhatsAppChat } from '../../services/whatsappService';
import { formatDate } from '../../utils/dateUtils';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dateTime = value => value ? `${formatDate(value)} · ${new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : '—';
const date = formatDate;
const label = type => ({ registration: 'Registration', renewal: 'Renewal', due: 'Due payment', other: 'Payment' }[type] || 'Payment');
const palette = type => ({ registration: 'bg-sky-50 text-sky-700 ring-sky-100', renewal: 'bg-violet-50 text-violet-700 ring-violet-100', due: 'bg-amber-50 text-amber-700 ring-amber-100', other: 'bg-emerald-50 text-emerald-700 ring-emerald-100' }[type] || 'bg-slate-50 text-slate-700 ring-slate-100');
const WhatsAppIcon = () => <svg viewBox="0 0 32 32" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M16 1.5C8.1 1.5 1.7 7.9 1.7 15.8c0 2.5.7 5 1.9 7.1L1.5 30.5l7.8-2a14.2 14.2 0 0 0 6.7 1.7c7.9 0 14.3-6.4 14.3-14.3S23.9 1.5 16 1.5Zm0 26.2c-2.2 0-4.3-.6-6.1-1.7l-.4-.2-4.6 1.2 1.2-4.5-.3-.5a11.7 11.7 0 1 1 10.2 5.7Zm6.4-8.8c-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.9.2-.3.4-1 1.2-1.2 1.5-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.8-2.1-2-2.5-.2-.4 0-.6.2-.7l.6-.7c.2-.2.3-.4.4-.6.1-.3 0-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.7-.7-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.3-1.4 3.3s1.4 3.8 1.6 4.1c.2.3 2.8 4.2 6.7 5.9.9.4 1.7.6 2.2.8.9.3 1.8.3 2.5.2.8-.1 2.2-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z" /></svg>;

export default function MemberHistoryPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const findMembers = async query => {
        setLoading(true); setMessage(''); setMember(null);
        try {
            const response = await api.get('/api/members', { params: { search: query, page: 1, limit: 10 } });
            const found = response.data?.data || [];
            setResults(found);
            if (!found.length) setMessage('No member found. Try their full mobile number or name.');
        } catch (error) {
            setResults([]);
            setMessage(error.response?.data?.message || 'Could not load member history. Please try again.');
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const query = search.trim();
        if (query.length < 3) { setResults([]); setMessage(''); return undefined; }
        const timer = window.setTimeout(() => findMembers(query), 350);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const memberId = searchParams.get('memberId');
        if (!memberId) return;
        let active = true;
        setLoading(true);
        loadMemberHistory(memberId, () => active)
            .catch(() => active && setMessage('Could not load this member history.'))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [searchParams]);

    async function loadMemberHistory(memberId, isActive = () => true) {
        const response = await api.get(`/api/members/${memberId}/history`);
        if (isActive()) {
            const data = response.data?.data;
            if (response.data?.success && data) {
                setMember({ ...data, paymentHistory: data.history || [] });
                setResults([]);
            }
        }
        return response;
    }

    const selectMember = async memberId => {
        setLoading(true); setMessage('');
        try { await loadMemberHistory(memberId); }
        catch { setMessage('Could not load this member history. Please try again.'); }
        finally { setLoading(false); }
    };

    const shareReceipt = transaction => {
        if (!member) return;
        const number = normalizeWhatsAppNumber(member.mobile);
        if (!number) return setMessage('This member does not have a valid WhatsApp number.');
        openWhatsAppChat(number, generateTransactionReceipt({ member, transaction, gymName: user?.gymName || user?.gym?.name }));
    };

    const transactions = member?.paymentHistory || [];
    // Calculate in the UI too. This keeps totals correct for legacy records
    // and for history opened directly from a member card.
    const totalReceived = transactions.reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
    return <div className="mx-auto w-full max-w-4xl pb-8">
        <button onClick={() => navigate('/dashboard/home')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-indigo-600"><ChevronLeft size={17} />Home</button>
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-xl shadow-indigo-200/60 sm:p-7">
            <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><History size={22} /></span><div><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-100">Member ledger</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Member History</h1><p className="mt-1 text-sm text-indigo-100">Find every payment, plan renewal, and receipt in one place.</p></div></div>
            <div className="mt-5 flex rounded-2xl bg-white p-1.5 shadow-lg"><label className="flex min-w-0 flex-1 items-center gap-2 px-3 text-slate-400"><Search size={19} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type at least 3 letters or mobile digits" className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" /></label>{loading && <span className="self-center pr-3 text-xs font-bold text-indigo-600">Finding…</span>}</div>
        </section>

        {message && <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{message}</p>}
        {results.length > 0 && !member && <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"><p className="px-2 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Tap a member to open their ledger</p>{results.map(item => <button key={item._id} onClick={() => selectMember(item._id)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-indigo-50"><span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-100 font-black text-indigo-700">{item.photoUrl ? <img src={item.photoUrl} alt="" className="h-full w-full object-cover" /> : item.name?.[0]?.toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-slate-800">{item.name}</span><span className="block text-xs font-medium text-slate-400">{item.mobile} · ID #{item.memberId}</span></span><span className="text-xs font-bold text-indigo-500">View history</span></button>)}</section>}

        {member && <>
            <section className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white shadow-xl shadow-emerald-100 sm:p-5">
                <div className="absolute -right-7 -top-9 h-32 w-32 rounded-full bg-white/10" /><div className="absolute -bottom-10 right-14 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-lg font-black text-white ring-2 ring-white/30 sm:h-14 sm:w-14">{member.photoUrl ? <img src={member.photoUrl} alt={`${member.name} profile`} className="h-full w-full object-cover" /> : member.name?.[0]?.toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-100">Member collection</p><h2 className="mt-0.5 break-words text-base font-black leading-tight sm:text-lg">{member.name}</h2><p className="mt-0.5 text-[11px] font-medium text-emerald-100">{member.mobile} · ID #{member.memberId}</p></div></div>
                <div className="relative mt-5 flex items-end justify-between border-t border-white/20 pt-4"><div><p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-100"><CircleDollarSign size={14} />Total received</p><p className="mt-1 text-3xl font-black tracking-tight">{money(totalReceived)}</p></div><span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white ring-1 ring-white/20">{transactions.length} payments</span></div>
            </section>
            <div className="mt-6 flex items-center justify-between"><div><h2 className="text-base font-black text-slate-800">Transaction timeline</h2><p className="mt-0.5 text-xs font-medium text-slate-400">Newest transaction first</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{transactions.length} records</span></div>
            <div className="mt-3 space-y-3">{transactions.length ? transactions.map((transaction, index) => <article key={transaction._id || `${transaction.date}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"><div className="min-w-0"><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${palette(transaction.transactionType)}`}>{label(transaction.transactionType)}</span><p className="mt-1.5 text-[11px] font-semibold text-slate-500">{dateTime(transaction.date)}</p></div><p className="shrink-0 text-base font-black text-emerald-600">+{money(transaction.amount)}</p></div><div className="grid grid-cols-2 gap-x-3 gap-y-3 px-4 py-3 text-[11px]"><p className="min-w-0 text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Plan</span><span className="mt-0.5 block truncate font-bold text-slate-700">{transaction.plan || member.planName || `${member.planDuration || 1} Month(s)`}</span></p><p className="text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Payment mode</span><span className="mt-0.5 block font-bold text-slate-700">{transaction.type || 'Cash'}</span></p>{Number(transaction.discountAmount) > 0 && <><p className="text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Discount</span><span className="mt-0.5 block font-bold text-rose-600">-{money(transaction.discountAmount)}</span></p><p className="text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Net total</span><span className="mt-0.5 block font-bold text-slate-700">{money(transaction.netTotal)}</span></p></>}{transaction.previousExpiryDate ? <><p className="text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Previous expiry</span><span className="mt-0.5 block font-bold text-slate-700">{date(transaction.previousExpiryDate)}</span></p><p className="text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">New plan expiry</span><span className="mt-0.5 block font-bold text-slate-700">{date(transaction.nextExpiryDate || member.expiryDate)}</span></p></> : <p className="text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Plan expiry</span><span className="mt-0.5 block font-bold text-slate-700">{date(transaction.nextExpiryDate || member.expiryDate)}</span></p>}<p className="text-slate-500"><span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Due left</span><span className="mt-0.5 block font-bold text-slate-700">{money(transaction.remainingDue)}</span></p></div><div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5"><p className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-slate-500"><UserRound size={13} className="shrink-0 text-slate-400" />Received by <span className="truncate text-slate-700">{transaction.collectedBy || 'Gym Owner'}</span></p><button onClick={() => shareReceipt(transaction)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-extrabold text-white shadow-sm shadow-emerald-100 transition hover:bg-emerald-700" aria-label="Send receipt on WhatsApp"><WhatsAppIcon />Receipt</button></div></article>) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-400">No recorded payments for this member yet.</div>}</div>
        </>}
    </div>;
}
