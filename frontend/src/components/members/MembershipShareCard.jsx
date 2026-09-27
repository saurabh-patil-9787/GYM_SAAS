import React, { forwardRef } from 'react';
import { Dumbbell } from 'lucide-react';

const date = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const MembershipShareCard = forwardRef(({ member, gymName, gymLogoUrl }, ref) => {
    if (!member) return null;
    const due = Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));
    return <div ref={ref} className="w-[720px] overflow-hidden rounded-[30px] bg-white font-sans text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#312e81] via-[#4f46e5] to-[#7c3aed] px-10 py-8 text-white">
            <div className="flex items-center gap-4">{gymLogoUrl ? <img src={gymLogoUrl} crossOrigin="anonymous" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/30" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Dumbbell size={29} /></span>}<div><p className="text-2xl font-black tracking-tight">{gymName || 'My Gym'}</p><p className="mt-1 text-sm font-semibold tracking-[0.18em] text-indigo-100">MEMBERSHIP CARD</p></div></div>
            <p className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Member #{member.memberId || '—'}</p>
        </div>
        <div className="p-10">
            <div className="flex items-center gap-6 border-b border-slate-200 pb-7">{member.photoUrl ? <img src={member.photoUrl} crossOrigin="anonymous" className="h-28 w-28 rounded-[26px] object-cover ring-4 ring-indigo-50" /> : <div className="flex h-28 w-28 items-center justify-center rounded-[26px] bg-indigo-100 text-4xl font-black text-indigo-600">{member.name?.charAt(0)?.toUpperCase()}</div>}<div className="min-w-0 flex-1"><p className="truncate text-3xl font-black tracking-tight">{member.name}</p><p className="mt-2 text-lg text-slate-500">+91 {member.mobile}</p><p className="mt-2 inline-block rounded-lg bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">Joined {date(member.joiningDate)}</p></div></div>
            <div className="mt-7 grid grid-cols-2 gap-x-10 gap-y-6"><Detail label="Membership plan" value={member.planName || `${member.planDuration || 1} Month plan`} /><Detail label="Plan duration" value={`${member.planDuration || 1} month${Number(member.planDuration) === 1 ? '' : 's'}`} /><Detail label="Start date" value={date(member.joiningDate)} /><Detail label="Expiry date" value={date(member.expiryDate)} /></div>
            <div className="mt-8 rounded-2xl bg-slate-50 p-5"><div className="grid grid-cols-3 gap-4"><Amount label="Total fee" value={member.totalFee} /><Amount label="Paid" value={member.paidFee} good /><Amount label="Balance due" value={due} warn={due > 0} /></div></div>
        </div>
        <div className="bg-slate-950 px-10 py-4 text-center text-sm font-semibold tracking-wide text-slate-300">Thank you for being part of the {gymName || 'gym'} family.</div>
    </div>;
});
const Detail = ({ label, value }) => <div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1.5 text-lg font-bold text-slate-800">{value}</p></div>;
const Amount = ({ label, value, good, warn }) => <div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-1 text-xl font-black ${good ? 'text-emerald-600' : warn ? 'text-rose-600' : 'text-slate-800'}`}>₹{Number(value || 0).toLocaleString('en-IN')}</p></div>;
export default MembershipShareCard;
