import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Gift, Plus, Users, UserCheck, Wallet, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const colorThemes = {
    purple: {
        gradient: 'from-purple-900/40 via-purple-900/10 to-[#13131f]',
        border: 'border-purple-500/50 sm:border-purple-500/20',
        mobileGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)] sm:shadow-none',
        hoverBorder: 'sm:hover:border-purple-500/50 sm:hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
        bgBlob: 'bg-purple-600',
        textBadge: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
        iconColor: 'text-purple-400',
        dotColor: 'bg-purple-400'
    },
    cyan: {
        gradient: 'from-cyan-900/40 via-cyan-900/10 to-[#13131f]',
        border: 'border-cyan-500/50 sm:border-cyan-500/20',
        mobileGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)] sm:shadow-none',
        hoverBorder: 'sm:hover:border-cyan-500/50 sm:hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
        bgBlob: 'bg-cyan-600',
        textBadge: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
        iconColor: 'text-cyan-400',
        dotColor: 'bg-cyan-400'
    },
    emerald: {
        gradient: 'from-emerald-900/40 via-emerald-900/10 to-[#13131f]',
        border: 'border-emerald-500/50 sm:border-emerald-500/20',
        mobileGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)] sm:shadow-none',
        hoverBorder: 'sm:hover:border-emerald-500/50 sm:hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        bgBlob: 'bg-emerald-600',
        textBadge: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-400',
        dotColor: 'bg-emerald-400'
    },
    red: {
        gradient: 'from-red-900/40 via-red-900/10 to-[#13131f]',
        border: 'border-red-500/50 sm:border-red-500/20',
        mobileGlow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)] sm:shadow-none',
        hoverBorder: 'sm:hover:border-red-500/50 sm:hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
        bgBlob: 'bg-red-600',
        textBadge: 'text-red-300 bg-red-500/10 border-red-500/20',
        iconColor: 'text-red-400',
        dotColor: 'bg-red-400'
    },
    amber: {
        gradient: 'from-amber-900/40 via-amber-900/10 to-[#13131f]',
        border: 'border-amber-500/50 sm:border-amber-500/20',
        mobileGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)] sm:shadow-none',
        hoverBorder: 'sm:hover:border-amber-500/50 sm:hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        bgBlob: 'bg-amber-600',
        textBadge: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
        iconColor: 'text-amber-400',
        dotColor: 'bg-amber-400'
    }
};

const StatCard = ({ title, value, colorTheme, subtext, onClick, animationDelay = "0ms", Icon }) => {
    const theme = colorThemes[colorTheme] || colorThemes.purple;
    return (
        <div
            onClick={onClick}
            style={{ animationDelay }}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} border ${theme.border} ${theme.mobileGlow} p-5 sm:p-6 cursor-pointer ${theme.hoverBorder} transition-all duration-500 animate-slide-up flex flex-col justify-between backdrop-blur-xl`}
        >
            <div className={`absolute -top-20 -right-20 w-40 h-40 sm:w-48 sm:h-48 rounded-full ${theme.bgBlob} blur-[80px] opacity-60 sm:opacity-30 sm:group-hover:opacity-60 transition-opacity duration-500`} />
            
            {Icon && (
                <Icon className={`absolute -bottom-6 -right-6 w-32 h-32 sm:w-40 sm:h-40 ${theme.iconColor} opacity-[0.08] sm:opacity-[0.03] sm:group-hover:opacity-[0.08] scale-110 sm:scale-100 sm:group-hover:scale-110 -rotate-12 sm:rotate-0 sm:group-hover:-rotate-12 transition-all duration-700 pointer-events-none`} />
            )}

            <div className="relative z-10 flex justify-between items-start mb-6 sm:mb-8">
                <div className={`p-3 sm:p-4 rounded-2xl bg-white/[0.05] sm:bg-white/[0.02] border border-white/[0.05] backdrop-blur-md scale-110 sm:scale-100 sm:group-hover:scale-110 sm:group-hover:bg-white/[0.05] transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`}>
                    {Icon && <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${theme.iconColor}`} />}
                </div>
                {subtext && (
                    <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.dotColor} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.dotColor}`}></span>
                        </span>
                        <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap border backdrop-blur-xl ${theme.textBadge} shadow-sm`}>
                            {subtext}
                        </span>
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-[11px] sm:text-xs font-bold text-gray-300 sm:text-gray-400 uppercase tracking-widest mb-1.5 sm:group-hover:text-gray-300 transition-colors">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none scale-105 sm:scale-100 sm:group-hover:scale-105 transition-transform origin-left">{value}</p>
                </div>
            </div>
            
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};

const DashboardStats = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const gymName = user?.gymName || user?.gym?.name || "our";
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, expiringSoon: 0, expiring1Day: 0, amountPending: 0 });
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [res, bdayRes] = await Promise.all([
                    api.get(`/api/members/dashboard-stats?t=${Date.now()}`),
                    api.get(`/api/members/upcoming-birthdays?t=${Date.now()}`)
                ]);
                setBirthdays(bdayRes.data);
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-gray-500 text-sm animate-pulse">Loading Stats...</div>;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Your gym at a glance</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-8">
                <StatCard title="Total Members" value={stats.total} colorTheme="purple" Icon={Users} onClick={() => navigate('/dashboard/members')} animationDelay="0ms" />
                <StatCard title="Active Members" value={stats.active} colorTheme="emerald" Icon={UserCheck} onClick={() => navigate('/dashboard/members?status=active')} animationDelay="50ms" />
                <StatCard title="Amount Pending" value={`₹${stats.amountPending?.toLocaleString('en-IN') || 0}`} colorTheme="amber" subtext="Unpaid Dues" Icon={Wallet} onClick={() => navigate('/dashboard/members?status=amount_pending')} animationDelay="100ms" />
                <StatCard title="Plan Expired" value={stats.expired} colorTheme="red" subtext="Needs Renewal" Icon={AlertCircle} onClick={() => navigate('/dashboard/members?status=expired')} animationDelay="150ms" />
                <StatCard title="Expiring in 1 Day" value={stats.expiring1Day} colorTheme="red" subtext="Urgent" Icon={Clock} onClick={() => navigate('/dashboard/members?status=expiring_1day')} animationDelay="200ms" />
                <StatCard title="Expiring Next 5 Days" value={stats.expiringSoon} colorTheme="cyan" subtext="Upcoming" Icon={CalendarDays} onClick={() => navigate('/dashboard/members?status=expiring_soon')} animationDelay="250ms" />
            </div>
            {/* Upcoming Birthdays Section */}
            <div className="animate-slide-up mt-10" style={{ animationDelay: '300ms' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                            <Gift className="text-pink-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Upcoming Birthdays</h2>
                            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 font-medium">Celebrate and connect with your members</p>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md self-start sm:self-auto">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                        </span>
                        <span className="text-sm font-bold text-white">{birthdays.length} <span className="text-gray-400 font-normal">Events</span></span>
                    </div>
                </div>

                {birthdays.length === 0 ? (
                    <div className="text-center py-16 bg-[#13131f] border border-dashed border-white/[0.08] rounded-3xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-5 shadow-inner relative z-10">
                            <Gift className="text-gray-600" size={28} />
                        </div>
                        <p className="text-base font-bold text-gray-400 relative z-10">No upcoming birthdays</p>
                        <p className="text-sm text-gray-500 mt-1 relative z-10">You're all caught up for now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {birthdays.map(member => (
                            <div key={member._id} className="group w-full bg-gradient-to-br from-[#13131f] to-[#0f0f1a] border border-white/[0.08] rounded-3xl p-5 hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-500/10 transition-colors" />
                                
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 relative z-10">
                                        {/* Image and basic info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg sm:text-xl font-bold text-white flex-shrink-0 ring-4 ring-[#13131f] shadow-xl overflow-hidden relative group-hover:scale-105 transition-transform">
                                                {member.photoUrl ? (
                                                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.charAt(0)
                                                )}
                                                {member.daysRemaining === 0 && (
                                                    <div className="absolute inset-0 bg-pink-500/20 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-base sm:text-lg truncate group-hover:text-pink-100 transition-colors">{member.name}</p>
                                                <p className="text-xs sm:text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                                                    <CalendarDays size={14} className="text-gray-500" />
                                                    {new Date(member.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Badge */}
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
                                            <div className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${member.daysRemaining === 0 ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.2)] animate-pulse' : 'bg-white/[0.03] text-gray-300 border border-white/[0.08]'}`}>
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
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-[0.98] ${
                                            member.daysRemaining === 0
                                                ? 'bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white shadow-lg shadow-[#25d366]/20 hover:shadow-[#25d366]/40 hover:-translate-y-0.5'
                                                : 'bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/20 hover:bg-[#25d366]/20'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
                                        </svg>
                                        Wish on WhatsApp
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) for Add Member */}
            <button
                onClick={() => navigate('/dashboard/members?add=true')}
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center justify-center bg-gradient-to-r from-purple-600 to-cyan-500 text-white w-14 h-14 rounded-full shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all duration-200"
                title="Add New Member"
            >
                <Plus size={24} />
            </button>
        </div>
    );
};

export default DashboardStats;
