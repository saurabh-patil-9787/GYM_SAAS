import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../components/Input';
import api from '../../api/axios';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // We expect the selectedGym to be passed down from the previous route (MemberLogin or FindGym)
    const selectedGym = location.state?.selectedGym;

    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!selectedGym) {
            navigate('/member/find-gym', { replace: true });
        }
    }, [selectedGym, navigate]);

    if (!selectedGym) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const res = await api.post('/api/password-reset/request', {
                mobile: mobile.trim(),
                gymId: selectedGym._id
            });
            
            // Store mobile and gymId to check status later
            sessionStorage.setItem('resetMobile', mobile.trim());
            sessionStorage.setItem('resetGymId', selectedGym._id);

            setSuccessMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 mt-8 md:mt-16">
                <button
                    onClick={() => navigate('/member/login', { state: { selectedGym } })}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Back to Login
                </button>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg"
                >
                    <AnimatePresence mode="wait">
                        {!successMessage ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-5 shadow-lg shadow-indigo-200">
                                        <ShieldAlert className="text-white" size={26} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Forgot Password</h2>
                                    <p className="text-slate-500 mt-1.5 text-sm">
                                        Enter your registered mobile number for {selectedGym.gymName}
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Mobile Number"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                        placeholder="10-digit mobile number"
                                        pattern="^[0-9]{10}$"
                                        minLength={10}
                                        maxLength={10}
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading || mobile.length !== 10}
                                        className={`w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                            loading || mobile.length !== 10
                                                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'
                                        }`}
                                    >
                                        {loading ? 'Sending Request...' : <>Request Reset <ArrowRight size={18} strokeWidth={2.5} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-center"
                            >
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 mb-5">
                                    <ShieldAlert className="text-emerald-600" size={26} strokeWidth={1.5} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Request Submitted</h2>
                                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                                    {successMessage}
                                </p>
                                
                                <button
                                    onClick={() => navigate('/member/password-reset/status')}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200"
                                >
                                    Check Request Status
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
