import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../components/Input';
import api from '../../api/axios';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [temporaryPassword, setTemporaryPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const mobile = sessionStorage.getItem('resetMobile');
        const gymId = sessionStorage.getItem('resetGymId');
        if (!mobile || !gymId) {
            navigate('/member/find-gym', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        const mobile = sessionStorage.getItem('resetMobile');
        const gymId = sessionStorage.getItem('resetGymId');

        setLoading(true);
        try {
            const res = await api.post('/api/password-reset/complete', {
                mobile,
                gymId,
                temporaryPassword: temporaryPassword.trim(),
                newPassword,
                confirmPassword
            });
            setSuccess(true);
            sessionStorage.removeItem('resetMobile');
            sessionStorage.removeItem('resetGymId');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 mt-8 md:mt-16">
                {!success && (
                    <button
                        onClick={() => navigate('/member/password-reset/status')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Back to Status
                    </button>
                )}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg"
                >
                    <AnimatePresence mode="wait">
                        {!success ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-5 shadow-lg shadow-indigo-200">
                                        <ShieldCheck className="text-white" size={26} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create New Password</h2>
                                    <p className="text-slate-500 mt-1.5 text-sm">
                                        Enter the temporary password from your gym owner to proceed.
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Temporary Password"
                                        value={temporaryPassword}
                                        onChange={(e) => setTemporaryPassword(e.target.value.toUpperCase())}
                                        placeholder="e.g. GYM12345"
                                        required
                                    />
                                    <Input
                                        label="New Password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                        minLength={8}
                                        required
                                    />
                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        minLength={8}
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading || !temporaryPassword || !newPassword || !confirmPassword}
                                        className={`w-full text-white font-bold py-3.5 mt-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                            loading || !temporaryPassword || !newPassword || !confirmPassword
                                                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'
                                        }`}
                                    >
                                        {loading ? <><RefreshCw size={18} className="animate-spin" /> Resetting...</> : <>Reset Password <ArrowRight size={18} strokeWidth={2.5} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-5">
                                    <ShieldCheck className="text-emerald-600" size={32} strokeWidth={2} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Reset Successful</h2>
                                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                                    Your password has been changed successfully. You can now log in to your Member Portal using your new password.
                                </p>
                                
                                <button
                                    onClick={() => navigate('/member/find-gym')}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200"
                                >
                                    Go to Login
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;
