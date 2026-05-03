import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Gift, Plus, Users, UserCheck, Wallet, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const colorThemes = {
    purple: {
        gradient: 'from-indigo-50 to-white',
        border: 'border-indigo-200',
        mobileGlow: 'shadow-sm sm:shadow-none',
        hoverBorder: 'sm:hover:border-indigo-300 sm:hover:shadow-md',
        bgBlob: 'bg-indigo-200',
        textBadge: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        iconColor: 'text-indigo-600',
        dotColor: 'bg-indigo-500'
    },
    cyan: {
        gradient: 'from-sky-50 to-white',
        border: 'border-sky-200',
        mobileGlow: 'shadow-sm sm:shadow-none',
        hoverBorder: 'sm:hover:border-sky-300 sm:hover:shadow-md',
        bgBlob: 'bg-sky-200',
        textBadge: 'text-sky-600 bg-sky-50 border-sky-200',
        iconColor: 'text-sky-600',
        dotColor: 'bg-sky-500'
    },
    emerald: {
        gradient: 'from-emerald-50 to-white',
        border: 'border-emerald-200',
        mobileGlow: 'shadow-sm sm:shadow-none',
        hoverBorder: 'sm:hover:border-emerald-300 sm:hover:shadow-md',
        bgBlob: 'bg-emerald-200',
        textBadge: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        iconColor: 'text-emerald-600',
        dotColor: 'bg-emerald-500'
    },
    red: {
        gradient: 'from-rose-50 to-white',
        border: 'border-rose-200',
        mobileGlow: 'shadow-sm sm:shadow-none',
        hoverBorder: 'sm:hover:border-rose-300 sm:hover:shadow-md',
        bgBlob: 'bg-rose-200',
        textBadge: 'text-rose-600 bg-rose-50 border-rose-200',
        iconColor: 'text-rose-500',
        dotColor: 'bg-rose-500'
    },
    amber: {
        gradient: 'from-amber-50 to-white',
        border: 'border-amber-200',
        mobileGlow: 'shadow-sm sm:shadow-none',
        hoverBorder: 'sm:hover:border-amber-300 sm:hover:shadow-md',
        bgBlob: 'bg-amber-200',
        textBadge: 'text-amber-600 bg-amber-50 border-amber-200',
        iconColor: 'text-amber-500',
        dotColor: 'bg-amber-500'
    }
};

const StatCard = ({ title, value, colorTheme, subtext, onClick, animationDelay = "0ms", Icon }) => {
    const theme = colorThemes[colorTheme] || colorThemes.purple;
    return (
        <div
            onClick={onClick}
            style={{ animationDelay }}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} border ${theme.border} ${theme.mobileGlow} p-4 sm:p-6 cursor-pointer ${theme.hoverBorder} transition-all duration-500 animate-slide-up flex flex-col justify-between`}
        >
            <div className={`absolute -top-20 -right-20 w-40 h-40 sm:w-48 sm:h-48 rounded-full ${theme.bgBlob} blur-[80px] opacity-40 sm:opacity-20 sm:group-hover:opacity-40 transition-opacity duration-500`} />

            {Icon && (
                <Icon className={`absolute -bottom-6 -right-6 w-32 h-32 sm:w-40 sm:h-40 ${theme.iconColor} opacity-[0.05] sm:opacity-[0.03] sm:group-hover:opacity-[0.06] scale-110 sm:scale-100 sm:group-hover:scale-110 -rotate-12 sm:rotate-0 sm:group-hover:-rotate-12 transition-all duration-700 pointer-events-none`} />
            )}

            <div className="relative z-10 flex justify-between items-start mb-3 sm:mb-8">
                <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-100 scale-110 sm:scale-100 sm:group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                    {Icon && <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${theme.iconColor}`} />}
                </div>
                {subtext && (
                    <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.dotColor} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.dotColor}`}></span>
                        </span>
                        <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap border ${theme.textBadge} shadow-sm`}>
                            {subtext}
                        </span>
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 sm:text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5 sm:group-hover:text-slate-600 transition-colors">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight leading-none scale-105 sm:scale-100 sm:group-hover:scale-105 transition-transform origin-left">{value}</p>
                </div>
            </div>
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

    if (loading) return <BicepCurlLoader text="Loading Stats..." fullScreen={false} />;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Your gym at a glance</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-8">
                <StatCard title="Total Members" value={stats.total} colorTheme="purple" Icon={Users} onClick={() => navigate('/dashboard/members')} animationDelay="0ms" />
                <StatCard title="Active Members" value={stats.active} colorTheme="emerald" Icon={UserCheck} onClick={() => navigate('/dashboard/members?status=active')} animationDelay="50ms" />
                <StatCard title="Amount Pending" value={`${stats.amountPending?.toLocaleString('en-IN') || 0}`} colorTheme="amber" subtext="Unpaid Dues" Icon={Wallet} onClick={() => navigate('/dashboard/members?status=amount_pending')} animationDelay="100ms" />
                <StatCard title="Plan Expired" value={stats.expired} colorTheme="red" subtext="Needs Renewal" Icon={AlertCircle} onClick={() => navigate('/dashboard/members?status=expired')} animationDelay="150ms" />
                <StatCard title="Expiring in 1 Day" value={stats.expiring1Day} colorTheme="red" subtext="Urgent" Icon={Clock} onClick={() => navigate('/dashboard/members?status=expiring_1day')} animationDelay="200ms" />
                <StatCard title="Expiring Next 5 Days" value={stats.expiringSoon} colorTheme="cyan" subtext="Upcoming" Icon={CalendarDays} onClick={() => navigate('/dashboard/members?status=expiring_soon')} animationDelay="250ms" />
            </div>
            {/* Upcoming Birthdays Section */}
            <div className="animate-slide-up mt-10" style={{ animationDelay: '300ms' }}>
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
            </div>

            {/* Floating Action Button (FAB) for Add Member */}
            <button
                onClick={() => navigate('/dashboard/members?add=true')}
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all duration-200"
                title="Add New Member"
            >
                <Plus size={24} />
            </button>
        </div>
    );
};

export default DashboardStats;
