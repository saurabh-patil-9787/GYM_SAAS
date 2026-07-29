import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const PasswordResetStatus = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('PENDING'); // PENDING, APPROVED, EXPIRED, REJECTED
    const [gymName, setGymName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStatus = async () => {
        const mobile = sessionStorage.getItem('resetMobile');
        const gymId = sessionStorage.getItem('resetGymId');
        
        if (!mobile || !gymId) {
            setError('No active password reset request found.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/api/password-reset/status', { mobile, gymId });
            setStatus(res.data.status);
            if (res.data.gymName) {
                setGymName(res.data.gymName);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Optional: Polling every 30 seconds while pending
        const interval = setInterval(() => {
            if (status === 'PENDING') {
                fetchStatus();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [status]);

    const renderContent = () => {
        if (error) {
            return (
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button onClick={() => navigate('/member/find-gym')} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200">
                        Start Over
                    </button>
                </div>
            );
        }

        if (loading && !status) {
            return (
                <div className="flex justify-center items-center py-10">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            );
        }

        switch (status) {
            case 'PENDING':
                return (
                    <div className="text-center">
                        <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Request Pending</h2>
                        <p className="text-slate-600 mb-6 text-sm">
                            Your password reset request has been sent. Please contact your gym owner and wait for approval.
                        </p>
                        <button onClick={fetchStatus} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2">
                            <RefreshCw size={16} /> Check Again
                        </button>
                    </div>
                );
            case 'APPROVED':
                return (
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Request Approved</h2>
                        <p className="text-slate-600 mb-6 text-sm">
                            Your password reset request has been approved by <strong>{gymName || 'your gym'}</strong>. 
                            Collect your temporary password from your gym owner.
                        </p>
                        <button onClick={() => navigate('/member/password-reset/complete')} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            Reset My Password
                        </button>
                    </div>
                );
            case 'REJECTED':
                return (
                    <div className="text-center">
                        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Request Rejected</h2>
                        <p className="text-slate-600 mb-6 text-sm">Your password reset request was rejected by the gym owner.</p>
                        <button onClick={() => navigate('/member/find-gym')} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200">
                            Start Over
                        </button>
                    </div>
                );
            case 'EXPIRED':
                return (
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Request Expired</h2>
                        <p className="text-slate-600 mb-6 text-sm">Your password reset request has expired or you've exceeded maximum attempts.</p>
                        <button onClick={() => navigate('/member/find-gym')} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200">
                            Start Over
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 mt-8 md:mt-16">
                <button
                    onClick={() => navigate('/member/find-gym')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Back to Start
                </button>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg"
                >
                    {renderContent()}
                </motion.div>
            </div>
        </div>
    );
};

export default PasswordResetStatus;
