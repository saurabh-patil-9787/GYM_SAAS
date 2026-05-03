import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { IndianRupee, AlertCircle, Calendar, Clock, CreditCard, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const RevenuePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [revenueData, setRevenueData] = useState({ todayCollection: 0, thisMonthCollection: 0, totalPendingDues: 0, chartData: [], recentTransactions: [] });
    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    useEffect(() => { fetchRevenueStats(); }, []);

    const fetchRevenueStats = async () => {
        try {
            const res = await api.get('/api/analytics/revenue');
            if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) throw new Error("API Route Not Found.");
            if (!res.data || typeof res.data !== 'object') throw new Error("Invalid response from server");
            setRevenueData(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching revenue stats:', err);
            setError('Failed to load revenue data / Authentication rejected.');
            setLoading(false);
        }
    };

    if (loading) return <BicepCurlLoader text="Loading Revenue Data..." fullScreen={false} />;

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-8 rounded-2xl flex flex-col items-center justify-center h-64 shadow-sm max-w-lg mx-auto mt-10">
                <div className="p-4 bg-rose-100 rounded-full mb-4"><AlertCircle size={40} /></div>
                <p className="font-semibold text-lg text-center">{error}</p>
                <button onClick={fetchRevenueStats} className="mt-6 px-8 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-all shadow-sm">Retry Connection</button>
            </div>
        );
    }

    const { todayCollection = 0, thisMonthCollection = 0, totalPendingDues = 0, chartData = [], recentTransactions = [] } = revenueData || {};
    const maxChartValue = Math.max(...chartData.map(d => Number(d.amount) || 0), 1);

    return (
        <div className="space-y-6 md:space-y-8 w-full max-w-[100vw] overflow-x-hidden p-1 sm:p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight px-1">Revenue Command Center</h1>
                    <p className="text-slate-500 mt-2 font-medium px-1 text-sm md:text-base">Real-time overview of your gym's collections and dues.</p>
                </div>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
                {/* Today */}
                <div className="relative overflow-hidden rounded-2xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 md:p-6">
                    <div className="absolute top-0 right-0 opacity-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-emerald-300 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                        <div className="flex justify-between items-start mb-2 md:mb-6">
                            <div className="bg-emerald-50 border border-emerald-200 p-2 sm:p-2.5 md:p-3 rounded-xl text-emerald-600"><Clock className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                            <span className="text-[8px] sm:text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 uppercase tracking-widest">Today</span>
                        </div>
                        <div>
                            <p className="text-slate-400 font-semibold text-[10px] sm:text-xs uppercase mb-1 truncate">Collected Today</p>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 flex items-center truncate"><span className="text-emerald-500 mr-1 text-xl sm:text-2xl md:text-3xl">₹</span>{todayCollection.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                {/* Month */}
                <div className="relative overflow-hidden rounded-2xl bg-white border border-indigo-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 md:p-6">
                    <div className="absolute top-0 right-0 opacity-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-indigo-300 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                        <div className="flex justify-between items-start mb-2 md:mb-6">
                            <div className="bg-indigo-50 border border-indigo-200 p-2 sm:p-2.5 md:p-3 rounded-xl text-indigo-600"><Calendar className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                            <span className="text-[8px] sm:text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-200 uppercase tracking-widest">Monthly</span>
                        </div>
                        <div>
                            <p className="text-slate-400 font-semibold text-[10px] sm:text-xs uppercase mb-1 truncate">Collected ({currentMonthName.substring(0,3)})</p>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 flex items-center truncate"><span className="text-indigo-500 mr-1 text-xl sm:text-2xl md:text-3xl">₹</span>{thisMonthCollection.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                {/* Pending */}
                <div className="relative overflow-hidden rounded-2xl bg-white border border-rose-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 md:p-6">
                    <div className="absolute top-0 right-0 opacity-20 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-rose-300 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                        <div className="flex justify-between items-start mb-2 md:mb-6">
                            <div className="bg-rose-50 border border-rose-200 p-2 sm:p-2.5 md:p-3 rounded-xl text-rose-500"><AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                            <span className="text-[8px] sm:text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-500 rounded-full border border-rose-200 uppercase tracking-widest">Pendings</span>
                        </div>
                        <div>
                            <p className="text-slate-400 font-semibold text-[10px] sm:text-xs uppercase mb-1 truncate">Total Pending</p>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 flex items-center truncate"><span className="text-rose-500 mr-1 text-xl sm:text-2xl md:text-3xl">₹</span>{totalPendingDues.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                {/* Chart */}
                <div className="relative overflow-hidden rounded-2xl bg-white border border-sky-200 shadow-sm hover:shadow-md transition-shadow flex flex-col p-4 sm:p-5 md:p-6 h-[160px] sm:h-auto min-h-[150px]">
                    <div className="flex justify-between items-center mb-1 sm:mb-2 z-10 shrink-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="bg-sky-50 text-sky-600 p-1 md:p-2 rounded-lg border border-sky-200"><BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                            <p className="text-slate-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider">Past 3 Months</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 px-1 pb-1 mt-1 relative z-10">
                        <div className="absolute inset-0 border-b border-dashed border-slate-200 pointer-events-none"></div>
                        {chartData.map((data, idx) => {
                            const rawHeight = (Number(data.amount) / maxChartValue) * 100;
                            const finalHeight = rawHeight > 0 ? Math.max(15, rawHeight) : 4;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center relative h-full justify-end max-w-[30%] md:max-w-16">
                                    <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-slate-700 mb-1 md:mb-2 truncate max-w-full">₹{Number(data.amount).toLocaleString()}</span>
                                    <div className="w-full bg-gradient-to-t from-indigo-500 to-sky-400 rounded-t-sm" style={{ height: `${finalHeight}%` }}></div>
                                    <span className="text-slate-400 text-[8px] sm:text-[10px] md:text-xs font-semibold mt-1 sm:mt-2 block tracking-wider uppercase truncate">{data.name.substring(0,3)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div className="mt-6 md:mt-8 pb-10 w-full overflow-hidden">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full relative overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 px-4 md:px-8 shrink-0">
                        <h2 className="text-base sm:text-lg md:text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="p-1.5 md:p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100"><CreditCard size={18} className="md:h-5 md:w-5" /></div>
                            Recent Cashflows
                        </h2>
                        <span className="text-[9px] md:text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-indigo-200 uppercase tracking-widest">Live Ledger</span>
                    </div>
                    <div className="overflow-x-auto w-full max-h-[400px] md:max-h-[500px]">
                        {recentTransactions.length === 0 ? (
                            <div className="p-8 md:p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[250px]">
                                <div className="p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-full mb-4"><Clock size={36} className="text-slate-300" /></div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-500 mb-2">No Transactions Yet</h3>
                                <p className="max-w-xs mx-auto text-xs md:text-sm">Once your members start making payments, they will appear here.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] md:text-xs uppercase tracking-widest font-bold sticky top-0 z-10 border-b border-slate-100">
                                    <tr>
                                        <th className="py-4 md:py-5 px-3 sm:px-4 md:px-8 whitespace-nowrap">Member Reference</th>
                                        <th className="py-4 md:py-5 px-3 sm:px-4 md:px-8">Date</th>
                                        <th className="hidden sm:table-cell py-4 md:py-5 px-3 sm:px-4 md:px-8">Modality</th>
                                        <th className="py-4 md:py-5 px-3 sm:px-4 md:px-8 text-right whitespace-nowrap">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.map((tx, idx) => (
                                        <tr key={tx._id || idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                            <td className="py-4 md:py-5 px-3 sm:px-4 md:px-8">
                                                <p className="font-bold text-slate-700 text-xs sm:text-sm md:text-base group-hover:text-indigo-600 transition-colors truncate max-w-[120px] sm:max-w-[150px] md:max-w-xs">{tx.memberName}</p>
                                                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-mono text-slate-400 mt-0.5 sm:mt-1">ID: {tx.memberId}</p>
                                            </td>
                                            <td className="py-4 md:py-5 px-3 sm:px-4 md:px-8">
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 font-medium bg-slate-50 inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-slate-100 whitespace-nowrap">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    <span className={`text-[8px] sm:text-[9px] font-bold tracking-[0.15em] uppercase px-2 md:px-2.5 py-0.5 rounded-md border text-center ${tx.transactionCategory === 'registration' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : tx.transactionCategory === 'renewal' ? 'bg-violet-50 text-violet-600 border-violet-200' : tx.transactionCategory === 'due' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{tx.transactionCategory || 'other'}</span>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell py-4 md:py-5 px-3 sm:px-4 md:px-8">
                                                <span className={`px-2 py-1 md:px-3 md:py-1.5 text-[9px] md:text-[10px] font-black tracking-wider uppercase rounded-full whitespace-nowrap ${tx.type === 'Online' ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>{tx.type}</span>
                                            </td>
                                            <td className="py-4 md:py-5 px-3 sm:px-4 md:px-8 text-right pr-4 md:pr-8">
                                                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-800 tracking-tight">+₹{Number(tx.amount).toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenuePage;
