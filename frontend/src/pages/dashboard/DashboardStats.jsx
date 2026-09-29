import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Gift, Users, UserCheck, Wallet, AlertCircle, Clock, CalendarDays, HourglassIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import PendingApprovalsSection from '../../components/members/PendingApprovalsSection';
import { useRealtimeEvent } from '../../context/RealtimeContext';

const colorThemes = {
    purple: {
        gradient: 'from-[#4338ca] via-[#5b4eea] to-[#7c3aed]',
        border: 'border-indigo-400/30', mobileGlow: 'shadow-xl shadow-indigo-200/70', hoverBorder: 'sm:hover:shadow-2xl sm:hover:shadow-indigo-300/60', bgBlob: 'bg-white', textBadge: 'text-white bg-white/15 border-white/20', iconColor: 'text-white', dotColor: 'bg-white'
    },
    cyan: {
        gradient: 'from-[#0369a1] via-[#0ea5e9] to-[#22c5d6]',
        border: 'border-sky-400/30', mobileGlow: 'shadow-xl shadow-sky-200/70', hoverBorder: 'sm:hover:shadow-2xl sm:hover:shadow-sky-300/60', bgBlob: 'bg-white', textBadge: 'text-white bg-white/15 border-white/20', iconColor: 'text-white', dotColor: 'bg-white'
    },
    emerald: {
        gradient: 'from-[#047857] via-[#059669] to-[#14b8a6]',
        border: 'border-emerald-400/30', mobileGlow: 'shadow-xl shadow-emerald-200/70', hoverBorder: 'sm:hover:shadow-2xl sm:hover:shadow-emerald-300/60', bgBlob: 'bg-white', textBadge: 'text-white bg-white/15 border-white/20', iconColor: 'text-white', dotColor: 'bg-white'
    },
    red: {
        gradient: 'from-[#be123c] via-[#e11d48] to-[#fb7185]',
        border: 'border-rose-400/30', mobileGlow: 'shadow-xl shadow-rose-200/70', hoverBorder: 'sm:hover:shadow-2xl sm:hover:shadow-rose-300/60', bgBlob: 'bg-white', textBadge: 'text-white bg-white/15 border-white/20', iconColor: 'text-white', dotColor: 'bg-white'
    },
    amber: {
        gradient: 'from-[#b45309] via-[#f59e0b] to-[#fbbf24]',
        border: 'border-amber-400/30', mobileGlow: 'shadow-xl shadow-amber-200/70', hoverBorder: 'sm:hover:shadow-2xl sm:hover:shadow-amber-300/60', bgBlob: 'bg-white', textBadge: 'text-white bg-white/15 border-white/20', iconColor: 'text-white', dotColor: 'bg-white'
    }
};

const StatCard = ({ title, value, colorTheme, subtext, onClick, animationDelay = "0ms", Icon, pulse }) => {
    const theme = colorThemes[colorTheme] || colorThemes.purple;
    return (
        <div
            onClick={onClick}
            style={{ animationDelay }}
            className={`group relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} border ${theme.border} ${theme.mobileGlow} p-4 sm:p-5 cursor-pointer ${theme.hoverBorder} transition-all duration-500 animate-slide-up flex flex-col justify-between shadow-sm hover:-translate-y-0.5`}
        >
            <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full ${theme.bgBlob} blur-[60px] opacity-20 transition-opacity duration-500`} />

            {Icon && (
                <Icon className={`absolute -bottom-5 -right-5 w-28 h-28 ${theme.iconColor} opacity-[0.12] pointer-events-none`} />
            )}

            <div className="relative z-10 flex justify-between items-start mb-2">
                <div className={`p-2.5 rounded-2xl bg-white/15 border border-white/20 shadow-sm backdrop-blur-sm`}>
                    {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.iconColor}`} />}
                </div>
                {(subtext || pulse) && (
                    <div className="flex items-center gap-1">
                        <span className="flex h-1.5 w-1.5 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.dotColor} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${theme.dotColor}`}></span>
                        </span>
                        {subtext && (
                            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border ${theme.textBadge}`}>
                                {subtext}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-sm sm:text-base font-extrabold text-white/90 uppercase tracking-wider mb-1 leading-tight">{title}</h3>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">{value}</p>
            </div>
        </div>
    );
};

const DashboardStats = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const gymName = user?.gymName || user?.gym?.name || "our";
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, expiringSoon: 0, expiring1Day: 0, amountPending: 0 });
    const [pendingCount, setPendingCount] = useState(0);
    const [birthdays, setBirthdays] = useState([]);
    const [showBirthdays, setShowBirthdays] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [res, bdayRes, pendRes] = await Promise.all([
                api.get(`/api/members/dashboard-stats?t=${Date.now()}`),
                api.get(`/api/members/upcoming-birthdays?t=${Date.now()}`),
                api.get('/api/members/pending/count').catch(() => ({ data: { count: 0 } }))
            ]);
            setBirthdays(bdayRes.data);
            setStats(res.data);
            setPendingCount(pendRes.data?.count || 0);
        } catch (error) {
            console.error("Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh owner dashboard when a member submits a renewal or when notifications arrive
    useRealtimeEvent('renewal_request', fetchData);
    useRealtimeEvent('notification', fetchData);

    if (loading) return <BicepCurlLoader text="Loading Stats..." fullScreen={false} />;

    return (
        <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6 animate-fade-in">
            </div>

            {/* Grid — 2 col mobile, 3 col tablet, 4 col desktop */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-3 mb-7">
                <StatCard title="Total Members" value={stats.total} colorTheme="purple" Icon={Users} onClick={() => navigate('/dashboard/members')} animationDelay="0ms" />
                <StatCard title="Active Members" value={stats.active} colorTheme="emerald" Icon={UserCheck} onClick={() => navigate('/dashboard/members?status=active')} animationDelay="50ms" />
                <StatCard title="Amt. Pending" value={`${stats.amountPending?.toLocaleString('en-IN') || 0}`} colorTheme="amber" subtext="Dues" Icon={Wallet} onClick={() => navigate('/dashboard/members?status=amount_pending')} animationDelay="100ms" />
                <StatCard title="Plan Expired" value={stats.expired} colorTheme="red" subtext="Renewal" Icon={AlertCircle} onClick={() => navigate('/dashboard/members?status=expired')} animationDelay="150ms" />
                <StatCard title="Expiring Today" value={stats.expiringToday ?? stats.expiring1Day} colorTheme="red" subtext="Urgent" Icon={Clock} onClick={() => navigate('/dashboard/members?status=expiring_today')} animationDelay="200ms" />
                <StatCard title="Exp. in 5 Days" value={stats.expiringSoon} colorTheme="cyan" subtext="Soon" Icon={CalendarDays} onClick={() => navigate('/dashboard/members?status=expiring_soon')} animationDelay="250ms" />
                <StatCard title="Birthdays" value={birthdays.length} colorTheme="purple" subtext="Next 10 days" Icon={Gift} onClick={() => setShowBirthdays(value => !value)} animationDelay="300ms" />
            </div>

            <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-3"><div className="rounded-2xl bg-amber-50 p-2.5 text-amber-600"><HourglassIcon size={21} /></div><div><h2 className="font-extrabold text-slate-800">Expiring soon</h2><p className="text-xs text-slate-500">Renewal windows for the next 15 days</p></div></div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[['1 to 5 days', stats.expiring1to5, 'expiring_1to5', 'bg-rose-500'], ['6 to 10 days', stats.expiring6to10, 'expiring_6to10', 'bg-amber-500'], ['11 to 15 days', stats.expiring11to15, 'expiring_11to15', 'bg-emerald-500']].map(([label, count, status, color]) => <button key={status} onClick={() => navigate(`/dashboard/members?status=${status}`)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-white"><span className={`mb-3 block h-2 w-8 rounded-full ${color}`} /><p className="text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-800">{count || 0}</p></button>)}
                </div>
            </section>

            <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-3"><div className="rounded-2xl bg-rose-50 p-2.5 text-rose-600"><AlertCircle size={21} /></div><div><h2 className="font-extrabold text-slate-800">Recently Expired</h2><p className="text-xs text-slate-500">Expired in the last 15 days</p></div></div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[['1 to 5 days', stats.expired1to5, 'expired_1to5', 'bg-rose-600'], ['6 to 10 days', stats.expired6to10, 'expired_6to10', 'bg-rose-500'], ['11 to 15 days', stats.expired11to15, 'expired_11to15', 'bg-rose-400']].map(([label, count, status, color]) => <button key={status} onClick={() => navigate(`/dashboard/members?status=${status}`)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-white"><span className={`mb-3 block h-2 w-8 rounded-full ${color}`} /><p className="text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-800">{count || 0}</p></button>)}
                </div>
            </section>

            {/* Pending Approvals Section */}
            <div id="pending-approvals-section">
                <PendingApprovalsSection onCountChange={setPendingCount} />
            </div>
            {/* Upcoming Birthdays Section */}
            {showBirthdays && <div className="animate-slide-up mt-10" style={{ animationDelay: '300ms' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100 shadow-sm">
                            <Gift className="text-pink-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Upcoming Birthdays</h2>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">Celebrate and connect with your members</p>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm self-start sm:self-auto">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                        </span>
                        <span className="text-sm font-bold text-slate-800">{birthdays.length} <span className="text-slate-400 font-normal">Events</span></span>
                    </div>
                </div>

                {birthdays.length === 0 ? (
                    <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl relative overflow-hidden">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-5 relative z-10">
                            <Gift className="text-slate-300" size={28} />
                        </div>
                        <p className="text-base font-bold text-slate-400 relative z-10">No upcoming birthdays</p>
                        <p className="text-sm text-slate-400 mt-1 relative z-10">You're all caught up for now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {birthdays.map(member => (
                            <div key={member._id} className="group w-full bg-white border border-slate-200 rounded-2xl p-5 hover:border-pink-200 hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full shadow-sm">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-100 transition-colors" />

                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 relative z-10">
                                        {/* Image and basic info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-lg sm:text-xl font-bold text-white flex-shrink-0 ring-4 ring-white shadow-md overflow-hidden relative group-hover:scale-105 transition-transform">
                                                {member.photoUrl ? (
                                                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0)
                                                )}
                                                {member.daysRemaining === 0 && (
                                                    <div className="absolute inset-0 bg-pink-400/20 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-base sm:text-lg truncate group-hover:text-pink-600 transition-colors">{member.name}</p>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                                                    <CalendarDays size={14} className="text-slate-400" />
                                                    {new Date(member.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Badge */}
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                            <div className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${member.daysRemaining === 0 ? 'bg-pink-50 text-pink-600 border border-pink-200 animate-pulse' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                                                {member.daysRemaining === 0 ? '🎉 Today!' : `⏳ In ${member.daysRemaining} days`}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 relative z-10">
                                    <a
                                        href={`https://wa.me/91${member.mobile}?text=${encodeURIComponent(
                                            member.daysRemaining === 0
                                                ? `🎉 वाढदिवसाच्या खूप खूप शुभेच्छा ${member.name}! 🎂\n\nतुम्ही आमच्या ${gymName} परिवाराचा एक महत्त्वाचा भाग आहात 💪❤️\nतुमचे फिटनेस गोल्स पूर्ण करण्यासाठी आम्ही नेहमी तुमच्यासोबत आहोत.\n\nया वर्षात तुम्हाला उत्तम आरोग्य, ताकद आणि यश मिळो हीच शुभेच्छा! 🔥\n\n🎁 तुमच्या वाढदिवसानिमित्त खास भेट:\n👉 Membership Renewal वर विशेष Discount\n👉 Supplements वर आकर्षक ऑफर\n\n🎁 ही ऑफर फक्त तुमच्यासाठी, तुमच्या वाढदिवसानिमित्त ${gymName} कडून खास भेट आहे 🎉\n\nKeep grinding 💪\n– ${gymName} Family`
                                                : `🎂 ${member.name}, तुमचा वाढदिवस फक्त ${member.daysRemaining} दिवसांवर आहे!\n\nतुम्ही आमच्या जिम परिवाराचा एक महत्त्वाचा भाग आहात 💪❤️\nतुमचा हा खास दिवस अविस्मरणीय जावो हीच मनापासून इच्छा!\n\nKeep grinding 💪\n\n– ${gymName} Family`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-[0.98] ${member.daysRemaining === 0
                                            ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:-translate-y-0.5'
                                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" />
                                        </svg>
                                        Wish on WhatsApp
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>}

        </div>
    );
};

export default DashboardStats;
