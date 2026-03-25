import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Users, UserCheck, AlertCircle, Gift, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const borderColorMap = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    pink: 'border-l-pink-500',
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    yellow: 'border-l-yellow-500',
};

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-700 border-l-4 ${borderColorMap[color] || 'border-l-gray-500'} hover:border-gray-600 transition-all cursor-pointer hover:scale-[1.02]`}
    >
        <div className="flex justify-between items-start gap-2">
            <div>
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-white truncate">{value}</h3>
                {subtext && <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">{subtext}</p>}
            </div>
            <div className={`p-2 sm:p-3 rounded-xl bg-${color}-500/10 text-${color}-400 shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
        </div>
    </div>
);

const DashboardStats = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const gymName = user?.gymName || user?.gym?.name || "our";
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, expiringSoon: 0, expiring1Day: 0 });
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);

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
                                            ? `Happy Birthday ${member.name}! 🎉🎂 Wishing you a fantastic year ahead! Team GymTrack.`
                                            : `Hey ${member.name}, your birthday is coming up in ${member.daysRemaining} days! We're excited to celebrate with you! 🎉`
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
        </div>
    );
};

export default DashboardStats;
