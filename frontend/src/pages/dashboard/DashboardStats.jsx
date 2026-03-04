import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Users, UserCheck, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all cursor-pointer hover:scale-[1.02]`}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
                {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const DashboardStats = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, expiringSoon: 0, expiring1Day: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/members');
                const members = res.data;

                const today = new Date();
                const fiveDaysFromNow = new Date();
                fiveDaysFromNow.setDate(today.getDate() + 5);

                const tomorrow = new Date();
                tomorrow.setDate(today.getDate() + 1);

                const total = members.length;
                const active = members.filter(m => new Date(m.expiryDate) >= today).length;
                const expired = members.filter(m => new Date(m.expiryDate) < today).length;
                const expiringSoon = members.filter(m => {
                    const expiry = new Date(m.expiryDate);
                    return expiry >= today && expiry <= fiveDaysFromNow;
                }).length;
                const expiring1Day = members.filter(m => {
                    const expiry = new Date(m.expiryDate);
                    return expiry >= today && expiry <= tomorrow;
                }).length;

                setStats({ total, active, expired, expiringSoon, expiring1Day });
            } catch (error) {
                console.error("Failed to fetch stats");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div>Loading Stats...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
        </div>
    );
};

export default DashboardStats;
