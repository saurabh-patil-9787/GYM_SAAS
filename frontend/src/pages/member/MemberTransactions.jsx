import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowDownCircle, ArrowUpCircle, AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const MemberTransactions = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/api/member/transactions');
            setData(res.data);
        } catch (err) {
            setError('Failed to load transactions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        return type === 'Online' ? 
            <ArrowUpCircle size={16} className="text-indigo-500" /> : 
            <ArrowDownCircle size={16} className="text-emerald-500" />;
    };

    const getTypeBadge = (transactionType, remark) => {
        // Fresh Start entries have a distinct amber/orange badge
        if (transactionType === 'renewal' && remark?.includes('Fresh Start')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        const styles = {
            registration: 'bg-blue-50 text-blue-600 border-blue-200',
            renewal: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            due: 'bg-rose-50 text-rose-600 border-rose-200',
            other: 'bg-slate-50 text-slate-600 border-slate-200'
        };
        return styles[transactionType] || styles.other;
    };

    const getTypeLabel = (transactionType, remark) => {
        if (transactionType === 'renewal' && remark?.includes('Fresh Start')) return 'Fresh Start';
        return transactionType || 'Payment';
    };

    if (loading) {
        return <BicepCurlLoader text="Loading Transactions..." fullScreen={false} />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">{error}</p>
                    <button
                        onClick={() => { setLoading(true); setError(''); fetchTransactions(); }}
                        className="mt-4 text-indigo-600 font-semibold text-sm hover:text-indigo-700 flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw size={14} /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-lg font-bold text-slate-800">Transaction History</h1>
                <p className="text-xs text-slate-400">All your payment records</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-xl p-3 border border-slate-200 text-center"
                >
                    <Wallet size={14} className="text-indigo-400 mx-auto mb-1" />
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Total Fee</p>
                    <p className="text-sm font-bold text-slate-800">₹{(data?.totalFee || 0).toLocaleString('en-IN')}</p>
                </motion.div>
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-xl p-3 border border-slate-200 text-center"
                >
                    <CreditCard size={14} className="text-emerald-400 mx-auto mb-1" />
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Paid</p>
                    <p className="text-sm font-bold text-emerald-600">₹{(data?.paidFee || 0).toLocaleString('en-IN')}</p>
                </motion.div>
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-3 border border-slate-200 text-center"
                >
                    <AlertCircle size={14} className="text-rose-400 mx-auto mb-1" />
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Due</p>
                    <p className={`text-sm font-bold ${(data?.outstandingDue || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{(data?.outstandingDue || 0).toLocaleString('en-IN')}
                    </p>
                </motion.div>
            </div>

            {/* Transaction List */}
            {!data?.transactions || data.transactions.length === 0 ? (
                <div className="text-center py-16">
                    <CreditCard size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No transactions yet</p>
                    <p className="text-slate-400 text-xs mt-1">Your payment history will appear here</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {data.transactions.map((txn, index) => (
                        <motion.div
                            key={txn._id || index}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="bg-white rounded-xl p-4 border border-slate-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                        {getTypeIcon(txn.type)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">₹{txn.amount?.toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(txn.date).toLocaleDateString('en-IN', { 
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadge(txn.transactionType, txn.remark)}`}>
                                    {getTypeLabel(txn.transactionType, txn.remark)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                                <span>Method: <span className="font-semibold text-slate-600">{txn.type || 'Cash'}</span></span>
                                {txn.plan && <span>Plan: <span className="font-semibold text-slate-600">{txn.plan}</span></span>}
                                {txn.remainingDue !== undefined && (
                                    <span>Due after: <span className="font-semibold text-slate-600">₹{txn.remainingDue?.toLocaleString('en-IN')}</span></span>
                                )}
                            </div>
                            {txn.remark && (
                                <p className="text-[10px] text-slate-400 mt-1 italic">"{txn.remark}"</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MemberTransactions;
