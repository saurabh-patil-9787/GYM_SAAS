import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, ArrowRight, Dumbbell, MapPin, UserPlus, KeyRound, Clock, CheckCircle, XCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../../components/Input';
import api from '../../api/axios';

// ─── Registration Pending Screen ─────────────────────────────────────────────
const RegistrationPendingScreen = ({ selectedGym, mobile, status, memberInfo, onReapplySuccess }) => {
    const navigate = useNavigate();
    const [reapplying, setReapplying] = useState(false);
    const [reapplySuccess, setReapplySuccess] = useState(false);
    const [error, setError] = useState('');
    const [gymPlans, setGymPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        planId: '',
        age: '',
        weight: '',
        height: '',
        city: '',
        dob: '',
    });

    useEffect(() => {
        if (memberInfo) {
            setFormData({
                name: memberInfo.name || '',
                planId: memberInfo.requestedPlanId || '',
                age: memberInfo.age || '',
                weight: memberInfo.weight || '',
                height: memberInfo.height || '',
                city: memberInfo.city || '',
                dob: memberInfo.dob ? new Date(memberInfo.dob).toISOString().split('T')[0] : '',
            });
        }
    }, [memberInfo]);

    useEffect(() => {
        if (selectedGym?._id && status === 'rejected') {
            setPlansLoading(true);
            api.get(`/api/public/plans/${selectedGym._id}`)
                .then(res => setGymPlans(res.data || []))
                .catch(() => setGymPlans([]))
                .finally(() => setPlansLoading(false));
        }
    }, [selectedGym?._id, status]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleReapply = async (e) => {
        e.preventDefault();
        setReapplying(true);
        setError('');
        try {
            await api.put(`/api/member/auth/reapply/${memberInfo?._id}`, {
                name: formData.name.trim(),
                planId: formData.planId || undefined,
                age: formData.age ? Number(formData.age) : undefined,
                weight: formData.weight ? Number(formData.weight) : undefined,
                height: formData.height ? Number(formData.height) : undefined,
                city: formData.city.trim() || undefined,
                dob: formData.dob || undefined,
            });
            setReapplySuccess(true);
            if (onReapplySuccess) {
                onReapplySuccess();
            }
        } catch (err) {
            console.error('Reapply failed', err);
            const serverErrors = err.response?.data?.errors;
            if (serverErrors && Array.isArray(serverErrors)) {
                setError(serverErrors.join(', '));
            } else {
                setError(err.response?.data?.message || 'Reapplication failed. Please try again.');
            }
        } finally {
            setReapplying(false);
        }
    };

    const isRejected = status === 'rejected';
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center"
        >
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 ${isRejected ? 'bg-rose-100' : 'bg-amber-100'}`}>
                {isRejected
                    ? <XCircle className="text-rose-500" size={40} strokeWidth={1.5} />
                    : (
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Clock className="text-amber-500" size={40} strokeWidth={1.5} />
                        </motion.div>
                    )
                }
            </div>

            {/* Title */}
            <h2 className={`text-xl font-bold mb-2 ${isRejected ? 'text-rose-700' : 'text-slate-800'}`}>
                {reapplySuccess ? 'Reapplication Submitted!' : (isRejected ? 'Registration Not Approved' : 'Waiting for Approval')}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {reapplySuccess
                    ? 'Your reapplication is waiting for the gym owner to review. You will get a notification once approved.'
                    : (isRejected
                        ? 'Your registration request was not approved. Please review/update your details below and reapply.'
                        : <>Your registration request has been sent to <span className="font-semibold text-slate-700">{selectedGym?.gymName}</span>. You'll be notified once the gym owner reviews it.</>
                    )
                }
            </p>

            {/* Error display */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl mb-5 text-xs font-semibold text-center">
                    {error}
                </div>
            )}

            {/* Reapply Form */}
            {isRejected && !reapplySuccess && (
                <form onSubmit={handleReapply} className="space-y-3 text-left mb-6 mt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Update Registration Details</p>
                    <Input
                        label="Full Name *"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        maxLength={50}
                        required
                    />
                    
                    {/* Plan Selection */}
                    {!plansLoading && gymPlans.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Preferred Plan (Optional)
                            </label>
                            <select
                                name="planId"
                                value={formData.planId}
                                onChange={handleChange}
                                className="w-full border border-slate-200 bg-white text-slate-800 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                            >
                                <option value="">Select a plan (optional)</option>
                                {gymPlans.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.planName} — {p.duration} Month{p.duration > 1 ? 's' : ''}{p.price != null ? ` — ₹${p.price}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        <Input
                            label="Age"
                            name="age"
                            type="number"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Age"
                            min={10}
                            max={80}
                        />
                        <Input
                            label="Weight (kg)"
                            name="weight"
                            type="number"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="kg"
                            min={20}
                            max={300}
                        />
                        <Input
                            label="Height (cm)"
                            name="height"
                            type="number"
                            value={formData.height}
                            onChange={handleChange}
                            placeholder="cm"
                            min={50}
                            max={250}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            label="City"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City name"
                            maxLength={50}
                        />
                        <Input
                            label="Date of Birth"
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={reapplying}
                        className="w-full py-3.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {reapplying ? (
                            <>
                                <RefreshCw size={15} className="animate-spin" />
                                Submitting Reapplication...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={15} />
                                Reapply for Membership
                            </>
                        )}
                    </button>
                </form>
            )}

            {/* Status indicator */}
            {!isRejected && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <p className="text-xs text-amber-700 font-semibold">Pending gym owner approval</p>
                    </div>
                </div>
            )}

            {/* What to expect */}
            {!isRejected && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2.5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">What happens next</p>
                    {[
                        { icon: '📋', text: 'The gym owner reviews your registration' },
                        { icon: '✅', text: 'Once approved, you\'ll get a notification' },
                        { icon: '🔐', text: 'You can then log in and access your dashboard' }
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <span className="text-sm">{step.icon}</span>
                            <p className="text-xs text-slate-600">{step.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* WhatsApp contact */}
            {selectedGym?.contactNumber && (
                <a
                    href={`https://wa.me/91${selectedGym.contactNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I registered on the member app (Mobile: ${mobile}) and wanted to check on my approval status.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm border border-emerald-200 transition-all"
                >
                    <MessageCircle size={16} /> Contact Gym on WhatsApp
                </a>
            )}

            <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
            >
                Back to Home
            </button>
        </motion.div>
    );
};

// Duplicate imports removed

const MemberLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { memberLogin, user, token, loading: authLoading } = useAuth();

    const selectedGym = location.state?.selectedGym;

    const [step, setStep] = useState('mobile'); // 'mobile' | 'login' | 'setup-password' | 'pending' | 'rejected'
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [memberInfo, setMemberInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    // ── Persistent session: already logged in as member → go straight to dashboard ──
    // AuthContext.loadUser() restores from the 30-day httpOnly cookie on every
    // app start. If that succeeds, the member never needs to type credentials again.
    useEffect(() => {
        if (!authLoading && token && user && user.role === 'member') {
            navigate('/member/dashboard', { replace: true });
            return;
        }
        // Only redirect to find-gym if not authenticated AND no gym was pre-selected
        if (!authLoading && !(token && user?.role === 'member') && !selectedGym) {
            navigate('/member/find-gym', { replace: true });
        }
    }, [authLoading, token, user, selectedGym, navigate]);

    // Silently wait while session is being restored to avoid a flicker
    if (authLoading) return null;
    if (!selectedGym) return null;

    const handleCheckMember = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/member/auth/check', {
                mobile: mobile.trim(),
                gymId: selectedGym._id
            });

            if (!res.data.exists) {
                setError('No member found with this mobile number at this gym.');
                setLoading(false);
                return;
            }

            if (res.data.registrationStatus === 'awaiting_approval') {
                setMemberInfo(res.data);
                setStep('pending');
                setLoading(false);
                return;
            }

            if (res.data.registrationStatus === 'rejected') {
                setMemberInfo(res.data);
                setStep('rejected');
                setLoading(false);
                return;
            }

            setMemberInfo(res.data);

            if (res.data.hasPassword) {
                setStep('login');
            } else {
                setStep('setup-password');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await memberLogin(mobile.trim(), password, selectedGym._id);
            // Navigate to member dashboard
            navigate('/member/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/member/auth/setup-password', {
                mobile: mobile.trim(),
                gymId: selectedGym._id,
                password
            });

            // Auto-login after setup
            const data = await memberLogin(mobile.trim(), password, selectedGym._id);
            navigate('/member/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 mt-8 md:mt-16">
                {/* Back Button */}
                <button
                    onClick={() => {
                        if (step === 'mobile' || step === 'pending' || step === 'rejected') {
                            navigate('/member/find-gym');
                        } else {
                            setStep('mobile');
                        }
                    }}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    {step === 'mobile' || step === 'pending' || step === 'rejected' ? 'Change Gym' : 'Back'}
                </button>

                {/* Pending / Rejected Screen (shown in place of the card) */}
                {(step === 'pending' || step === 'rejected') && (
                    <RegistrationPendingScreen
                        selectedGym={selectedGym}
                        mobile={mobile}
                        status={step === 'rejected' ? 'rejected' : 'awaiting_approval'}
                        memberInfo={memberInfo}
                        onReapplySuccess={() => setStep('pending')}
                    />
                )}

                {/* Normal Login Flow — hidden when pending/rejected */}
                {step !== 'pending' && step !== 'rejected' && (
                <>
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
                            <span className="text-[11px] text-slate-500">{selectedGym.city}{selectedGym.pincode ? ` — ${selectedGym.pincode}` : ''}</span>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-200">Selected</span>
                </motion.div>

                {/* Main Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg"
                >
                    <AnimatePresence mode="wait">
                        {/* Step 1: Enter Mobile */}
                        {step === 'mobile' && (
                            <motion.div
                                key="mobile"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-5 shadow-lg shadow-indigo-200">
                                        <Dumbbell className="text-white" size={26} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Member Login</h2>
                                    <p className="text-slate-500 mt-1.5 text-sm">Enter your registered mobile number</p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleCheckMember} className="space-y-4">
                                    <Input
                                        label="Mobile Number"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                        placeholder="10-digit mobile number"
                                        pattern="^[0-9]{10}$"
                                        minLength={10}
                                        maxLength={10}
                                        title="Mobile number must be exactly 10 digits"
                                        error={mobile.length > 0 && mobile.length < 10 ? "Must be 10 digits" : ""}
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
                                        {loading ? 'Checking...' : <>Continue <ArrowRight size={18} strokeWidth={2.5} /></>}
                                    </button>
                                </form>

                                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                                    <p className="text-xs text-slate-400 mb-3">New to this gym?</p>
                                    <Link
                                        to="/member/register"
                                        state={{ selectedGym }}
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                                    >
                                        <UserPlus size={15} />
                                        Register as New Member
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Enter Password (existing member with password) */}
                        {step === 'login' && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-8">
                                    {memberInfo?.photoUrl ? (
                                        <img src={memberInfo.photoUrl} alt={memberInfo.name} className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-indigo-200 object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">{memberInfo?.name?.charAt(0)?.toUpperCase()}</span>
                                        </div>
                                    )}
                                    <h2 className="text-xl font-bold text-slate-800">Welcome, {memberInfo?.name?.split(' ')[0]}!</h2>
                                    <p className="text-slate-500 mt-1 text-sm">Enter your password to continue</p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                            loading
                                                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'
                                        }`}
                                    >
                                        {loading ? 'Logging in...' : <>Login <ArrowRight size={18} strokeWidth={2.5} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 3: Setup Password (first time) */}
                        {step === 'setup-password' && (
                            <motion.div
                                key="setup"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-5 shadow-lg shadow-amber-200">
                                        <KeyRound className="text-white" size={26} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Set Your Password</h2>
                                    <p className="text-slate-500 mt-1.5 text-sm">Welcome <span className="font-semibold text-slate-700">{memberInfo?.name}</span>! Create a password for future logins.</p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSetupPassword} className="space-y-4">
                                    <Input
                                        label="Create Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        minLength={8}
                                        required
                                    />
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        minLength={8}
                                        error={confirmPassword.length > 0 && password !== confirmPassword ? "Passwords don't match" : ""}
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading || password.length < 8 || password !== confirmPassword}
                                        className={`w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                            loading || password.length < 8 || password !== confirmPassword
                                                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'
                                        }`}
                                    >
                                        {loading ? 'Setting up...' : <>Set Password & Login <ArrowRight size={18} strokeWidth={2.5} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                </>
                )}
            </div>
        </div>
    );
};

export default MemberLogin;
