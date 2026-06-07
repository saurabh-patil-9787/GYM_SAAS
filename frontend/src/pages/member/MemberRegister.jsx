import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, MapPin, CheckCircle, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../components/Input';
import api from '../../api/axios';

const MemberRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const selectedGym = location.state?.selectedGym;

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        age: '',
        weight: '',
        height: '',
        city: '',
        planId: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [gymPlans, setGymPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(false);

    useEffect(() => {
        if (selectedGym?._id) {
            setPlansLoading(true);
            api.get(`/api/public/plans/${selectedGym._id}`)
                .then(res => setGymPlans(res.data || []))
                .catch(() => setGymPlans([]))
                .finally(() => setPlansLoading(false));
        }
    }, [selectedGym?._id]);

    useEffect(() => {
        if (!selectedGym) {
            navigate('/member/find-gym', { replace: true });
        }
    }, [selectedGym, navigate]);

    if (!selectedGym) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/member/auth/register', {
                name: formData.name.trim(),
                mobile: formData.mobile.trim(),
                password: formData.password,
                gymId: selectedGym._id,
                planId: formData.planId || undefined,
            });

            setSuccess(true);
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors && Array.isArray(serverErrors)) {
                setError(serverErrors.join(', '));
            } else {
                setError(err.response?.data?.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 mt-8 md:mt-12">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/member/login', { state: { selectedGym } })}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Back to Login
                </button>

                {/* Selected Gym Card */}
                <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm mb-6 flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                        {selectedGym.logoUrl ? (
                            <img src={selectedGym.logoUrl} alt={selectedGym.gymName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-sm">{selectedGym.gymName?.charAt(0)?.toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{selectedGym.gymName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-slate-400" />
                            <span className="text-[11px] text-slate-500">{selectedGym.city}</span>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* Success Screen */}
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-5">
                                <CheckCircle className="text-emerald-600" size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Registration Submitted!</h2>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                Your registration request has been sent to <span className="font-semibold text-slate-700">{selectedGym.gymName}</span>. 
                                You'll be able to log in once the gym owner approves your request.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                                <p className="text-xs text-amber-700 font-medium">⏳ Waiting for gym owner approval</p>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                            >
                                Go to Home
                            </button>
                        </motion.div>
                    ) : (
                        /* Registration Form */
                        <motion.div
                            key="form"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg"
                        >
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-5 shadow-lg shadow-indigo-200">
                                    <UserPlus className="text-white" size={26} strokeWidth={1.5} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Join as Member</h2>
                                <p className="text-slate-500 mt-1.5 text-sm">Fill in your details to register</p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <Input
                                    label="Full Name *"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    maxLength={50}
                                    required
                                />
                                <Input
                                    label="Mobile Number *"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={(e) => handleChange({ target: { name: 'mobile', value: e.target.value.replace(/\D/g, '') } })}
                                    placeholder="10-digit mobile"
                                    pattern="^[0-9]{10}$"
                                    minLength={10}
                                    maxLength={10}
                                    error={formData.mobile.length > 0 && formData.mobile.length < 10 ? "Must be 10 digits" : ""}
                                    required
                                />
                                <Input
                                    label="Password *"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min 8 characters"
                                    minLength={8}
                                    required
                                />
                                <Input
                                    label="Confirm Password *"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    minLength={8}
                                    error={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword ? "Passwords don't match" : ""}
                                    required
                                />

                                {/* Plan Selection (only shown if gym has plans) */}
                                {!plansLoading && gymPlans.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><Tag size={11} /> Preferred Plan (Optional)</span>
                                        </label>
                                        <select
                                            value={formData.planId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, planId: e.target.value }))}
                                            className="w-full border border-slate-200 bg-white text-slate-800 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        >
                                            <option value="">Select a plan (optional)</option>
                                            {gymPlans.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.planName} — {p.duration} Month{p.duration > 1 ? 's' : ''}{p.price != null ? ` — ₹${p.price}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-slate-400 mt-1">The gym owner will confirm your plan during approval.</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-4 ${
                                        loading
                                            ? 'bg-slate-400 cursor-not-allowed opacity-70'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'
                                    }`}
                                >
                                    {loading ? 'Submitting...' : <>Submit Registration <UserPlus size={18} strokeWidth={2.5} /></>}
                                </button>
                            </form>

                            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
                                Already registered? <Link to="/member/login" state={{ selectedGym }} className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Login here</Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MemberRegister;
