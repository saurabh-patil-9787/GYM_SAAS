import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { IndianRupee, AlertCircle, Calendar, Clock, CreditCard, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const RevenuePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [revenueData, setRevenueData] = useState({
        todayCollection: 0,
        thisMonthCollection: 0,
        totalPendingDues: 0,
        chartData: [],
        recentTransactions: []
    });

    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    useEffect(() => {
        fetchRevenueStats();
    }, []);

    const fetchRevenueStats = async () => {
        try {
            const res = await api.get('/api/analytics/revenue');
            
            if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
                throw new Error("API Route Not Found. Server failed to route correctly.");
            }
            
            if (!res.data || typeof res.data !== 'object') {
                throw new Error("Invalid response from server");
            }

            setRevenueData(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching revenue stats:', err);
            setError('Failed to load revenue data / Authentication rejected.');
            setLoading(false);
        }
    };

    if (loading) {
        return <BicepCurlLoader text="Loading Revenue Data..." fullScreen={false} />;
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-8 rounded-2xl flex flex-col items-center justify-center h-64 backdrop-blur-md shadow-xl max-w-lg mx-auto mt-10">
                <div className="p-4 bg-red-500/20 rounded-full mb-4 animate-pulse">
                    <AlertCircle size={40} className="opacity-90" />
                </div>
                <p className="font-semibold text-lg text-center">{error}</p>
                <button onClick={fetchRevenueStats} className="mt-6 px-8 py-2.5 bg-red-600/90 hover:bg-red-600 text-white font-medium rounded-xl transition-all shadow-lg flex items-center justify-center">
                    Retry Connection
                </button>
            </div>
        );
    }

    const { 
        todayCollection = 0, 
        thisMonthCollection = 0, 
        totalPendingDues = 0, 
        chartData = [],
        recentTransactions = [] 
    } = revenueData || {};

    const maxChartValue = Math.max(...chartData.map(d => Number(d.amount) || 0), 1);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500 w-full max-w-[100vw] overflow-x-hidden p-1 sm:p-2">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 tracking-tight leading-tight px-1">
                        Revenue Command Center
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium px-1 text-sm md:text-base">Real-time overview of your gym's collections and dues.</p>
                </div>
            </div>

            {/* Premium Aesthetic Cards Wrap */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
                
                {/* 1. Today Card */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-[#13131f] border border-white/[0.05] shadow-2xl p-4 sm:p-5 md:p-6 cursor-default">
                    <div className="absolute top-0 right-0 p-8 opacity-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-emerald-400 to-transparent rounded-bl-full pointer-events-none scale-110"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                        <div className="flex justify-between items-start mb-2 md:mb-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 sm:p-2.5 md:p-3 rounded-xl md:rounded-2xl text-emerald-400">
                                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-bold px-2 py-1 bg-white/[0.02] text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-widest shadow-sm">Today</span>
                        </div>
                        <div>
                            <p className="text-gray-400 font-semibold text-[10px] sm:text-xs md:text-sm tracking-wide sm:tracking-widest uppercase mb-1 drop-shadow-md truncate">Collected Today</p>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white flex items-center tracking-tight truncate">
                                <span className="text-emerald-500 mr-1 text-xl sm:text-2xl md:text-3xl lg:text-4xl">₹</span>
                                {todayCollection.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* 2. This Month Card */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-[#13131f] border border-white/[0.05] shadow-2xl p-4 sm:p-5 md:p-6 cursor-default">
                    <div className="absolute top-0 right-0 p-8 opacity-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-purple-400 to-transparent rounded-bl-full pointer-events-none scale-110"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                        <div className="flex justify-between items-start mb-2 md:mb-6">
                            <div className="bg-purple-500/10 border border-purple-500/20 p-2 sm:p-2.5 md:p-3 rounded-xl md:rounded-2xl text-purple-400">
                                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-bold px-2 py-1 bg-white/[0.02] text-purple-400 rounded-full border border-purple-500/20 uppercase tracking-widest shadow-sm">Monthly</span>
                        </div>
                        <div>
                            <p className="text-gray-400 font-semibold text-[10px] sm:text-xs md:text-sm tracking-wide sm:tracking-widest uppercase mb-1 drop-shadow-md truncate">Collected ({currentMonthName.substring(0,3)})</p>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white flex items-center tracking-tight truncate">
                                <span className="text-purple-500 mr-1 text-xl sm:text-2xl md:text-3xl lg:text-4xl">₹</span>
                                {thisMonthCollection.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* 3. Pending Dues Card */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-[#13131f] border border-white/[0.05] shadow-2xl p-4 sm:p-5 md:p-6 cursor-default">
                    <div className="absolute top-0 right-0 p-8 opacity-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-red-500 to-transparent rounded-bl-full pointer-events-none scale-110"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                        <div className="flex justify-between items-start mb-2 md:mb-6">
                            <div className="bg-red-500/10 border border-red-500/20 p-2 sm:p-2.5 md:p-3 rounded-xl md:rounded-2xl text-red-500">
                                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-bold px-2 py-1 bg-white/[0.02] text-red-400 rounded-full border border-red-500/20 uppercase tracking-widest shadow-sm">Pendings</span>
                        </div>
                        <div>
                            <p className="text-gray-400 font-semibold text-[10px] sm:text-xs md:text-sm tracking-wide sm:tracking-widest uppercase mb-1 drop-shadow-md truncate">Total Pending</p>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white flex items-center tracking-tight truncate">
                                <span className="text-red-500 mr-1 text-xl sm:text-2xl md:text-3xl lg:text-4xl">₹</span>
                                {totalPendingDues.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* 4. Mini Column Chart Card */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-[#13131f] border border-white/[0.05] shadow-2xl flex flex-col p-4 sm:p-5 md:p-6 h-[160px] sm:h-auto min-h-[150px] cursor-default">
                    <div className="flex justify-between items-center mb-1 sm:mb-2 z-10 shrink-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="bg-blue-500/10 text-blue-400 p-1 md:p-2 rounded-lg border border-blue-500/20">
                                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-gray-300 font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-wider">Past 3 Months</p>
                        </div>
                    </div>
                    
                    {/* Embedded Column Chart */}
                    <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 px-1 pb-1 mt-1 relative z-10">
                        <div className="absolute inset-0 border-b border-dashed border-white/[0.05] pointer-events-none"></div>
                        {chartData.map((data, idx) => {
                            const rawHeight = (Number(data.amount) / maxChartValue) * 100;
                            // Ensure min height for visuals & max height cap for boundaries
                            const finalHeight = rawHeight > 0 ? Math.max(15, rawHeight) : 4; 
                            
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center relative h-full justify-end max-w-[30%] md:max-w-16">
                                    <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-white mb-1 md:mb-2 drop-shadow-md truncate max-w-full">
                                        ₹{Number(data.amount).toLocaleString()}
                                    </span>
                                    <div 
                                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm opacity-100 shadow-[0_0_10px_rgba(6,182,212,0.3)] relative"
                                        style={{ height: `${finalHeight}%` }}
                                    >
                                    </div>
                                    <span className="text-gray-400 text-[8px] sm:text-[10px] md:text-xs font-semibold mt-1 sm:mt-2 block tracking-wider uppercase truncate">{data.name.substring(0,3)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Transactions Section Isolated */}
            <div className="mt-6 md:mt-8 pb-10 w-full overflow-hidden">
                <div className="bg-[#13131f] rounded-2xl md:rounded-3xl border border-white/[0.05] shadow-2xl transition flex flex-col w-full max-w-full relative overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-white/[0.05] bg-white/[0.01] flex flex-wrap justify-between items-center gap-3 px-4 md:px-8 shrink-0 relative z-10">
                        <h2 className="text-base sm:text-lg md:text-2xl font-black text-white flex items-center gap-3">
                            <div className="p-1.5 md:p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)]"><CreditCard size={18} className="md:h-5 md:w-5" /></div>
                            Recent Cashflows
                        </h2>
                        <span className="text-[9px] md:text-[10px] font-bold bg-white/[0.02] text-purple-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-purple-500/20 uppercase tracking-widest">
                            Live Ledger
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto w-full max-h-[400px] md:max-h-[500px] scrollbar-thin scrollbar-thumb-white/[0.1] scrollbar-track-transparent relative z-10">
                        {recentTransactions.length === 0 ? (
                            <div className="p-8 md:p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px]">
                                <div className="p-4 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-full mb-4">
                                    <Clock size={36} className="text-gray-600 md:w-12 md:h-12" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-gray-400 mb-2">No Transactions Yet</h3>
                                <p className="max-w-xs mx-auto text-xs md:text-sm px-4">Once your members start making payments, they will appear securely logged here.</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#0f0f1a] text-gray-500 text-[10px] md:text-xs uppercase tracking-widest font-bold sticky top-0 z-10 box-shadow-sm border-b border-white/[0.05]">
                                        <tr>
                                            <th className="py-4 md:py-5 px-3 sm:px-4 md:px-8 whitespace-nowrap">Member Reference</th>
                                            <th className="py-4 md:py-5 px-3 sm:px-4 md:px-8">Date</th>
                                            <th className="hidden sm:table-cell py-4 md:py-5 px-3 sm:px-4 md:px-8">Modality</th>
                                            <th className="py-4 md:py-5 px-3 sm:px-4 md:px-8 text-right whitespace-nowrap">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.map((tx, idx) => (
                                            <tr key={tx._id || idx} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                                <td className="py-4 md:py-5 px-3 sm:px-4 md:px-8">
                                                    <p className="font-bold text-gray-200 text-xs sm:text-sm md:text-base group-hover:text-purple-300 transition-colors truncate max-w-[120px] sm:max-w-[150px] md:max-w-xs">{tx.memberName}</p>
                                                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-mono text-gray-600 mt-0.5 sm:mt-1">ID: {tx.memberId}</p>
                                                </td>
                                                <td className="py-4 md:py-5 px-3 sm:px-4 md:px-8">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <div className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-medium bg-white/[0.02] inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-white/[0.05] whitespace-nowrap shadow-sm">
                                                            {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <span className={`text-[8px] sm:text-[9px] font-bold tracking-[0.15em] uppercase px-2 md:px-2.5 py-0.5 rounded-md border text-center ${
                                                            tx.transactionCategory === 'registration' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]' :
                                                            tx.transactionCategory === 'renewal' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-[0_0_8px_rgba(217,70,239,0.15)]' :
                                                            tx.transactionCategory === 'due' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.15)]' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                        }`}>
                                                            {tx.transactionCategory || 'other'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell py-4 md:py-5 px-3 sm:px-4 md:px-8">
                                                    <span className={`px-2 py-1 md:px-3 md:py-1.5 text-[9px] md:text-[10px] font-black tracking-wider uppercase rounded-full shadow-sm whitespace-nowrap ${
                                                        tx.type === 'Online' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="py-4 md:py-5 px-3 sm:px-4 md:px-8 text-right pr-4 md:pr-8">
                                                    <span className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                        +₹{Number(tx.amount).toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenuePage;
