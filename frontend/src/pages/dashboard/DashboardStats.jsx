import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Users, UserCheck, AlertCircle, Gift, IndianRupee, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const stylesMap = {
    blue: {
        border: 'border-blue-500/50',
        shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]',
        gradient: 'from-blue-400',
        iconBg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400'
    },
    green: {
        border: 'border-green-500/50',
        shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]',
        gradient: 'from-green-400',
        iconBg: 'bg-green-500/10 border-green-500/30',
        text: 'text-green-400'
    },
    pink: {
        border: 'border-pink-500/50',
        shadow: 'shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]',
        gradient: 'from-pink-400',
        iconBg: 'bg-pink-500/10 border-pink-500/30',
        text: 'text-pink-400'
    },
    red: {
        border: 'border-red-500/50',
        shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]',
        gradient: 'from-red-400',
        iconBg: 'bg-red-500/10 border-red-500/30',
        text: 'text-red-400'
    },
    orange: {
        border: 'border-orange-500/50',
        shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]',
        gradient: 'from-orange-400',
        iconBg: 'bg-orange-500/10 border-orange-500/30',
        text: 'text-orange-400'
    },
    yellow: {
        border: 'border-yellow-500/50',
        shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]',
        gradient: 'from-yellow-400',
        iconBg: 'bg-yellow-500/10 border-yellow-500/30',
        text: 'text-yellow-400'
    }
};

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => {
    const theme = stylesMap[color] || stylesMap.blue;
    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-gray-800/80 border ${theme.border} ${theme.shadow} p-5 md:p-6 transition-all duration-300 hover:-translate-y-2 group cursor-pointer`}
        >
            <div className={`absolute top-0 right-0 p-8 opacity-20 w-32 h-32 bg-gradient-to-bl ${theme.gradient} to-transparent rounded-bl-full pointer-events-none scale-110 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500`}></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start gap-3 mb-4 md:mb-6">
                    <div className="flex-1">
                        <p className="text-gray-200 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 drop-shadow-md">{title}</p>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white truncate drop-shadow-md">{value}</h3>
                        {subtext && <p className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wide ${theme.text}`}>{subtext}</p>}
                    </div>
                    <div className={`p-2.5 sm:p-3 rounded-xl border ${theme.iconBg} ${theme.text} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardStats = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const gymName = user?.gymName || user?.gym?.name || "our";
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, expiringSoon: 0, expiring1Day: 0 });
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPing, setShowPing] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowPing(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [res, bdayRes] = await Promise.all([
                    api.get(`/api/members/dashboard-stats?t=${Date.now()}`),
                    api.get(`/api/members/upcoming-birthdays?t=${Date.now()}`)
                ]);

                const data = res.data;
                setBirthdays(bdayRes.data);

                setStats({
                    total: data.total,
                    active: data.active,
                    expired: data.expired,
                    expiringSoon: data.expiringSoon,
                    expiring1Day: data.expiring1Day,
                    amountPending: data.amountPending
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading Stats...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6">
                <StatCard
                    title="Total Members"
                    value={stats.total}
                    icon={Users}
                    color="blue"
                    onClick={() => navigate('/dashboard/members')}
                />
                <StatCard
                    title="Active Members"
                    value={stats.active}
                    icon={UserCheck}
                    color="green"
                    onClick={() => navigate('/dashboard/members?status=active')}
                />
                <StatCard
                    title="Amount Pending"
                    value={stats.amountPending}
                    icon={IndianRupee}
                    color="pink"
                    subtext="Unpaid Dues"
                    onClick={() => navigate('/dashboard/members?status=amount_pending')}
                />
                <StatCard
                    title="Plan Expired"
                    value={stats.expired}
                    icon={AlertCircle}
                    color="red"
                    subtext="Needs Renewal"
                    onClick={() => navigate('/dashboard/members?status=expired')}
                />
                <StatCard
                    title="Expiring in 1 Day"
                    value={stats.expiring1Day}
                    icon={AlertCircle}
                    color="orange"
                    subtext="Urgent Renewals"
                    onClick={() => navigate('/dashboard/members?status=expiring_1day')}
                />
                <StatCard
                    title="Expiring Next 5 Days"
                    value={stats.expiringSoon}
                    icon={AlertCircle}
                    color="yellow"
                    subtext="Upcoming Renewals"
                    onClick={() => navigate('/dashboard/members?status=expiring_soon')}
                />
            </div>

            {/* Upcoming Birthdays Section */}
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                        <Gift size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Upcoming Birthdays</h2>
                </div>

                {birthdays.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                        No upcoming birthdays in the next 10 days.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {birthdays.map(member => (
                            <div key={member._id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-pink-500/50 transition-colors">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-xl font-bold text-white border-2 border-gray-700">
                                    {member.photoUrl ? (
                                        <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        member.name.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold">{member.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        DOB: {new Date(member.dob).toLocaleDateString('en-GB')}
                                    </p>
                                    <p className={`text-xs mt-1 font-medium ${member.daysRemaining === 0 ? 'text-pink-400 animate-pulse' : 'text-purple-400'}`}>
                                        {member.daysRemaining === 0 ? '🎉 Today!' : `In ${member.daysRemaining} Days`}
                                    </p>
                                </div>
                                <a
                                    href={`https://wa.me/91${member.mobile}?text=${encodeURIComponent(
                                        member.daysRemaining === 0
                                            ? `🎉 वाढदिवसाच्या खूप खूप शुभेच्छा ${member.name}! 🎂\n\nतुम्ही आमच्या ${gymName} परिवाराचा एक महत्त्वाचा भाग आहात 💪❤️\nतुमचे फिटनेस गोल्स पूर्ण करण्यासाठी आम्ही नेहमी तुमच्यासोबत आहोत.\n\nया वर्षात तुम्हाला उत्तम आरोग्य, ताकद आणि यश मिळो हीच शुभेच्छा! 🔥\n\n🎁 तुमच्या वाढदिवसानिमित्त खास भेट:\n👉 Membership Renewal वर विशेष Discount\n👉 Supplements वर आकर्षक ऑफर\n\n🎁 ही ऑफर फक्त तुमच्यासाठी, तुमच्या वाढदिवसानिमित्त ${gymName} कडून खास भेट आहे 🎉\n\nKeep grinding 💪\n– ${gymName} Family`
                                            : `🎂 ${member.name}, तुमचा वाढदिवस फक्त ${member.daysRemaining} दिवसांवर आहे!\n\nतुम्ही आमच्या जिम परिवाराचा एक महत्त्वाचा भाग आहात 💪❤️\nतुमचा हा खास दिवस अविस्मरणीय जावो हीच मनापासून इच्छा!\n\nKeep grinding 💪\n\n– ${gymName} Family`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                    title="Wish on WhatsApp"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) for Add Member */}
            <button
                onClick={() => navigate('/dashboard/members?add=true')}
                className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-110 hover:shadow-indigo-500/50 transition duration-300"
                title="Add New Member"
            >
                {showPing && (
                    <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-blue-400" style={{ animationDuration: '2s' }}></div>
                )}
                <Plus size={24} className="md:w-7 md:h-7 relative z-10" />
            </button>
        </div>
    );
};

export default DashboardStats;
