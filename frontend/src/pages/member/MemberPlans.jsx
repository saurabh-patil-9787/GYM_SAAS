import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Check, Clock, AlertCircle, RefreshCw, Zap, ArrowLeft, CreditCard, Wallet, Shield, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

// ─── Load Razorpay Script ─────────────────────────────────────────────────────
const loadRazorpayScript = () =>
    new Promise(resolve => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// ─── Payment Success Screen ───────────────────────────────────────────────────
const PaymentSuccessScreen = ({ plan, expiryDate, onDone }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-lg text-center"
    >
        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            >
                <Check size={40} className="text-emerald-500" strokeWidth={2.5} />
            </motion.div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Payment Successful!</h2>
        <p className="text-sm text-slate-500 mb-5">
            Your <span className="font-semibold text-slate-700">{plan?.planName}</span> plan is now active.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold text-slate-800">₹{plan?.price?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Plan Duration</span>
                <span className="font-semibold text-slate-700">{plan?.duration} month{plan?.duration > 1 ? 's' : ''}</span>
            </div>
            {expiryDate && (
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Valid Until</span>
                    <span className="font-bold text-emerald-600">
                        {new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            )}
        </div>
        <button
            onClick={onDone}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
        >
            Go to Dashboard
        </button>
    </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const MemberPlans = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const action = searchParams.get('action'); // 'continue', 'fresh-start', 'rejoin'

    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pendingRequest, setPendingRequest] = useState(null);
    const [gymInfo, setGymInfo] = useState(null); // online payment enabled?
    const [paymentResult, setPaymentResult] = useState(null); // { plan, expiryDate }

    const fetchData = useCallback(async () => {
        try {
            const [plansRes, statusRes, profileRes] = await Promise.all([
                api.get('/api/member/plans'),
                api.get('/api/member/renewal/status'),
                api.get('/api/member/profile')
            ]);
            setPlans(plansRes.data);
            if (statusRes.data.hasPendingRequest) {
                setPendingRequest(statusRes.data.request);
            }
            // gymInfo carries onlinePaymentsEnabled
            setGymInfo(profileRes.data?.gym || null);
        } catch (err) {
            setError('Failed to load plans');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Razorpay Online Payment ──────────────────────────────────────────────
    const handleOnlinePayment = async (overrideAction) => {
        if (!selectedPlan) return;
        setProcessing(true);
        setError('');

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError('Payment gateway failed to load. Please try again.');
            setProcessing(false);
            return;
        }

        try {
            // 1. Create order on backend
            const currentAction = overrideAction || action;
            const renewalType = currentAction === 'fresh-start' ? 'fresh_start' : currentAction === 'rejoin' ? 'rejoin' : 'standard';
            const orderRes = await api.post('/api/payments/create-order', { planId: selectedPlan._id });
            const { order, key_id, planName, planDuration, planPrice, gymName, memberName, memberMobile } = orderRes.data;

            // 2. Open Razorpay checkout
            const rzpOptions = {
                key: key_id,
                amount: order.amount,
                currency: order.currency,
                name: gymName,
                description: `${planName} — ${planDuration} month${planDuration > 1 ? 's' : ''}`,
                order_id: order.id,
                prefill: {
                    name: memberName,
                    contact: memberMobile
                },
                theme: { color: '#6366f1' },
                modal: {
                    ondismiss: () => {
                        setProcessing(false);
                        setError('Payment was cancelled.');
                    }
                },
                handler: async (response) => {
                    // 3. Verify on backend
                    try {
                        const verifyRes = await api.post('/api/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: selectedPlan._id,
                            renewalType
                        });
                        setPaymentResult({
                            plan: selectedPlan,
                            expiryDate: verifyRes.data.newExpiryDate
                        });
                    } catch (verifyErr) {
                        setError(verifyErr.response?.data?.message || 'Payment verification failed. Contact support.');
                    } finally {
                        setProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(rzpOptions);
            rzp.on('payment.failed', (response) => {
                setError(`Payment failed: ${response.error?.description || 'Unknown error'}`);
                setProcessing(false);
            });
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate payment');
            setProcessing(false);
        }
    };

    // ── Continue Plan (Standard Renewal without payment) ─────────────────────
    const handleContinuePlan = async () => {
        if (!selectedPlan) return;
        setProcessing(true);
        setError('');
        try {
            const res = await api.post('/api/member/renewal/standard', { planId: selectedPlan._id });
            setSuccess(`Membership renewed! New expiry: ${new Date(res.data.newExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
            setSelectedPlan(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to renew membership');
        } finally {
            setProcessing(false);
        }
    };

    // ── Fresh Start Request ───────────────────────────────────────────────────
    const handleFreshStart = async () => {
        if (!selectedPlan) return;
        setProcessing(true);
        setError('');
        try {
            await api.post('/api/member/renewal/fresh-start-request', { planId: selectedPlan._id });
            setSuccess('Fresh Start request submitted! Waiting for gym owner approval.');
            setSelectedPlan(null);
            const statusRes = await api.get('/api/member/renewal/status');
            if (statusRes.data.hasPendingRequest) setPendingRequest(statusRes.data.request);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setProcessing(false);
        }
    };

    // ── Rejoin ────────────────────────────────────────────────────────────────
    const handleRejoin = async () => {
        if (!selectedPlan) return;
        setProcessing(true);
        setError('');
        try {
            const res = await api.post('/api/member/rejoin', { planId: selectedPlan._id });
            setSuccess(res.data.message || 'Welcome back! Your membership is now active.');
            setTimeout(() => navigate('/member/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to rejoin');
        } finally {
            setProcessing(false);
        }
    };

    // Decide which action to fire with params
    const handleActionWithParams = (selectedAction, useOnlinePayment = false) => {
        if (selectedAction === 'fresh-start') return handleFreshStart();
        if (selectedAction === 'rejoin') {
            if (useOnlinePayment && gymInfo?.onlinePaymentsEnabled) return handleOnlinePayment(selectedAction);
            return handleRejoin();
        }
        // 'continue' or default
        if (useOnlinePayment && gymInfo?.onlinePaymentsEnabled) return handleOnlinePayment(selectedAction);
        return handleContinuePlan();
    };

    const getDurationLabel = (months) => {
        if (months === 1) return '1 Month';
        if (months === 3) return '3 Months';
        if (months === 6) return '6 Months';
        if (months === 12) return '1 Year';
        return `${months} Months`;
    };

    if (loading) return <BicepCurlLoader text="Loading Plans..." fullScreen={false} />;

    // If payment was successful, show success screen
    if (paymentResult) {
        return (
            <div className="p-4">
                <PaymentSuccessScreen
                    plan={paymentResult.plan}
                    expiryDate={paymentResult.expiryDate}
                    onDone={() => navigate('/member/dashboard')}
                />
            </div>
        );
    }

    const onlinePaymentsEnabled = gymInfo?.onlinePaymentsEnabled === true;

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                {action && (
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </button>
                )}
                <div>
                    <h1 className="text-lg font-bold text-slate-800">
                        {action === 'fresh-start' ? 'Fresh Start' : action === 'rejoin' ? 'Rejoin Gym' : 'Membership Plans'}
                    </h1>
                    <p className="text-xs text-slate-400">
                        {action === 'fresh-start'
                            ? 'Select a plan to start fresh — request sent to owner'
                            : action === 'rejoin'
                            ? 'Choose a plan to rejoin'
                            : 'Choose a plan that fits your goals'}
                    </p>
                </div>
            </div>

            {/* Pending Request Banner */}
            {pendingRequest && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
                >
                    <div className="flex items-start gap-3">
                        <Clock size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800">Pending Request</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Your {pendingRequest.planName} ({pendingRequest.planDuration} month) Fresh Start request is waiting for owner approval.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Success Message */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-start gap-3">
                            <Check size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-semibold text-emerald-700">{success}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle size={18} className="text-rose-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-semibold text-rose-700">{error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!selectedPlan && !success && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 mb-4 text-center">
                    <p className="text-xs font-semibold text-indigo-800">💡 Select a plan from the options below to view renewal & payment options.</p>
                </div>
            )}

            {/* Plans Grid */}
            {plans.length === 0 ? (
                <div className="text-center py-16">
                    <FileText size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No plans available</p>
                    <p className="text-slate-400 text-xs mt-1">Ask your gym owner to create membership plans</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {plans.map((plan, index) => (
                        <motion.button
                            key={plan._id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedPlan(selectedPlan?._id === plan._id ? null : plan)}
                            className={`w-full text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
                                selectedPlan?._id === plan._id
                                    ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100'
                                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-bold text-slate-800">{plan.planName}</h3>
                                        {plan.duration === 12 && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                Best Value
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">{getDurationLabel(plan.duration)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-slate-800">₹{plan.price.toLocaleString('en-IN')}</p>
                                    {plan.duration > 1 && (
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            ₹{Math.round(plan.price / plan.duration).toLocaleString('en-IN')}/mo
                                        </p>
                                    )}
                                </div>
                            </div>
                            {selectedPlan?._id === plan._id && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-3 pt-3 border-t border-indigo-200 flex items-center gap-2"
                                >
                                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                                        <Check size={12} className="text-white" />
                                    </div>
                                    <span className="text-xs font-semibold text-indigo-600">Selected</span>
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </div>
            )}

            {/* ── Action Buttons ── */}
            {selectedPlan && !success && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-6 space-y-4 pb-12"
                >
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select a Renewal Option</h4>

                    {/* Option 1: Standard Continuation / Pay Online */}
                    {(!action || action === 'continue' || action === 'rejoin') && (
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-700">Option 1: Standard Renewal</p>
                                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">Recommended</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Extend your membership from your current expiry date or rejoin using this plan.
                            </p>
                            {onlinePaymentsEnabled ? (
                                <>
                                    <button
                                        onClick={() => handleActionWithParams(action || 'continue', true)}
                                        disabled={processing}
                                        className={`w-full rounded-xl py-3 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-200 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] ${
                                            processing ? 'opacity-70 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {processing ? (
                                            <><RefreshCw size={14} className="animate-spin" /> Processing Payment...</>
                                        ) : (
                                            <><CreditCard size={14} /> Pay Online — ₹{selectedPlan.price.toLocaleString('en-IN')}</>
                                        )}
                                    </button>
                                    <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
                                        <Shield size={11} className="text-emerald-500" /> Secure payment powered by Razorpay
                                    </div>
                                </>
                            ) : (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <Wallet size={16} className="text-slate-400 mx-auto mb-1.5" />
                                    <p className="text-xs font-bold text-slate-700">Pay Offline at Gym</p>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                        This gym doesn't accept online payments yet. Please pay in person to renew.
                                    </p>
                                    {gymInfo?.contactNumber && (
                                        <a
                                            href={`https://wa.me/91${gymInfo.contactNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'd like to renew my membership (${selectedPlan.planName} — ₹${selectedPlan.price}).`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 hover:bg-emerald-100 transition-all"
                                        >
                                            <MessageCircle size={12} /> Contact Gym
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Option 2: Request Fresh Start */}
                    {(!action || action === 'fresh-start') && (
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                            <p className="text-xs font-bold text-slate-700">Option 2: Request Fresh Start</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Request the gym owner to start your plan from your next check-in visit (requires approval).
                            </p>
                            <button
                                onClick={() => handleActionWithParams('fresh-start', false)}
                                disabled={processing}
                                className={`w-full rounded-xl py-3 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] ${
                                    processing ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {processing ? (
                                    <><RefreshCw size={14} className="animate-spin" /> Submitting Request...</>
                                ) : (
                                    <><Zap size={14} /> Request Fresh Start — ₹{selectedPlan.price.toLocaleString('en-IN')}</>
                                )}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center">
                                Request will be sent to the gym owner. Payment will be collected offline at the gym.
                            </p>
                        </div>
                    )}

                    {/* WhatsApp link if online payment is enabled */}
                    {onlinePaymentsEnabled && gymInfo?.contactNumber && (
                        <div className="text-center pt-1">
                            <span className="text-xs text-slate-400">Prefer to pay offline? </span>
                            <a
                                href={`https://wa.me/91${gymInfo.contactNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'd like to pay offline for ${selectedPlan.planName} (₹${selectedPlan.price}).`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline-offset-2 hover:underline transition-colors"
                            >
                                Contact gym on WhatsApp
                            </a>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default MemberPlans;
