import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Zap, Shield, CreditCard, ChevronRight, Loader2, RefreshCcw } from 'lucide-react';

const plans = [
    {
        id: 'Monthly',
        title: 'Monthly Pass',
        price: '₹249',
        duration: '/month',
        features: ['Full Dashboard Access', 'Unlimited Members', 'Standard Support'],
        popular: false
    },
    {
        id: 'Yearly',
        title: 'Annual Pass',
        price: '₹2400',
        duration: '/year',
        features: ['Full Dashboard Access', 'Unlimited Members', '24/7 Priority Support', 'Save 20% vs Monthly'],
        popular: true
    }
];

const SubscriptionPage = () => {
    const { user, updateUser } = useAuth();
    const { settings, loading: settingsLoading } = useSettings();
    const navigate = useNavigate();
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!document.querySelector('script[src*="razorpay"]')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    const handlePayment = async (planType) => {
        setLoadingPlan(planType);
        setError(null);
        try {
            const { data: orderData } = await api.post('/api/subscription/create-order', { planType });

            if (!orderData.success) {
                throw new Error("Failed to create order");
            }

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: "INR",
                name: "TrackON Gym SaaS",
                description: `${planType} Subscription`,
                order_id: orderData.order.id,
                handler: async function (response) {
                    try {
                        const { data: verifyData } = await api.post('/api/subscription/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planType
                        });

                        if (verifyData.success) {
                            updateUser({
                                planStatus: 'ACTIVE',
                                planExpiryDate: verifyData.newExpiry
                            });
                            setSuccessMessage(`🎉 Payment Successful! Your plan is active till: ${new Date(verifyData.newExpiry).toLocaleDateString()}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            
                            setTimeout(() => {
                                navigate('/dashboard');
                            }, 3000);
                        }
                    } catch (err) {
                        setError('Payment verification failed. Please contact support if amount was deducted.');
                    }
                },
                prefill: {
                    name: user?.ownerName,
                    email: user?.email,
                    contact: user?.mobile
                },
                theme: {
                    color: "#4f46e5" // indigo-600
                }
            };

            const rzp1 = new window.Razorpay(options);

            rzp1.on('payment.failed', function (response) {
                setError(`Payment Failed: ${response.error.description || 'Check console for details.'}`);
            });

            rzp1.open();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || err.message || 'Unknown error occurred';
            setError(`Failed to initiate payment: ${errorMsg}. Please try again later.`);
        } finally {
            setLoadingPlan(null);
        }
    };

    let daysUntilExpiry = 0;
    if (user?.planExpiryDate) {
        const diffTime = new Date(user.planExpiryDate) - new Date();
        daysUntilExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const handleCheckStatus = async () => {
        try {
            const res = await api.get('/api/auth/me');
            updateUser(res.data);
            if (res.data.planStatus === 'ACTIVE') {
                 navigate('/dashboard');
            } else {
                 alert("Your plan is still expired. Try again after admin confirms payment.");
            }
        } catch(err) { 
            console.error(err); 
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 text-slate-800">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                    Upgrade Your Gym Experience
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                    Get uninterrupted access to TrackON's powerful dashboard, member management, and advanced analytics.
                </p>
            </div>

            {/* Status Section */}
            <div className={`mb-12 p-6 rounded-2xl border bg-white shadow-sm flex flex-col md:flex-row items-center justify-between transition-all ${user?.planStatus === 'EXPIRED' ? 'border-rose-200' : 'border-slate-200'}`}>
                <div>
                    <h2 className="text-2xl justify-center md:justify-start font-bold flex items-center gap-2 mb-2">
                        {user?.planStatus === 'ACTIVE' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
                        Current Status
                    </h2>
                    <p className={`text-lg font-medium ${user?.planStatus === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {user?.planStatus === 'ACTIVE' ? 'Active Subscription' : 'Expired'}
                    </p>
                    {user?.planExpiryDate && (
                        <p className="text-slate-500 mt-1">
                            {user?.planStatus === 'ACTIVE' ? `Expires in ${daysUntilExpiry} days (${new Date(user.planExpiryDate).toLocaleDateString()})` : `Expired on ${new Date(user.planExpiryDate).toLocaleDateString()}`}
                        </p>
                    )}
                </div>
                {user?.planStatus === 'EXPIRED' && (
                    <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end gap-3">
                        <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 font-semibold animate-pulse">
                            Action Required: Renew to restore access
                        </div>
                        <button 
                            onClick={handleCheckStatus} 
                            className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 text-slate-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <RefreshCcw size={16}/> Offline Admin Renewal? Check Status
                        </button>
                    </div>
                )}
            </div>

            {/* Messages */}
            {!settingsLoading && !settings.isOnlinePaymentEnabled && (
                <div className="mb-8 p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-4 text-rose-700 max-w-2xl mx-auto shadow-sm">
                    <AlertCircle className="shrink-0 mt-0.5 text-rose-500" size={28} />
                    <div>
                        <h3 className="font-bold text-rose-700 text-lg mb-1">Online Renewals Disabled</h3>
                        <p className="text-rose-600">{settings.subscriptionMessage || "Online payment is currently stopped. Please connect with admin for plan renewal."}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-600 max-w-2xl mx-auto">
                    <AlertCircle className="shrink-0 mt-0.5 text-rose-500" />
                    <p>{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col items-center justify-center text-center gap-3 max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-300 shadow-sm">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center -mt-10 shadow-sm mb-2 border-4 border-white">
                        <CheckCircle2 size={32} className="text-white" />
                    </div>
                    <p className="text-xl font-bold text-emerald-700">{successMessage}</p>
                    <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-colors cursor-pointer z-10 block">
                        Go to Dashboard Now
                    </button>
                    <p className="text-sm mt-1 text-emerald-500 animate-pulse">Auto-redirecting...</p>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col bg-white border ${plan.popular
                            ? 'border-indigo-500 shadow-md'
                            : 'border-slate-200 shadow-sm'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 inset-x-0 mx-auto justify-center flex">
                                <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-b-xl inline-block shadow-sm">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        <div className="p-8 pt-12 flex-1">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.title}</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-extrabold text-slate-800">{plan.price}</span>
                                <span className="text-slate-500 font-medium">{plan.duration}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                        <CheckCircle2 size={20} className={plan.popular ? 'text-indigo-600' : 'text-slate-400'} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-8 pt-0 mt-auto">
                            <button
                                onClick={() => handlePayment(plan.id)}
                                disabled={loadingPlan !== null || (!settingsLoading && !settings.isOnlinePaymentEnabled)}
                                className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 font-bold text-lg transition-all duration-300 group ${
                                    !settingsLoading && !settings.isOnlinePaymentEnabled
                                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                                    : plan.popular
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    } ${(loadingPlan !== null) && settings.isOnlinePaymentEnabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {!settingsLoading && !settings.isOnlinePaymentEnabled ? (
                                    <>
                                        <AlertCircle size={20} className="text-slate-400" />
                                        Unavailable
                                    </>
                                ) : loadingPlan === plan.id ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        Select {plan.title}
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-80">
                <div className="flex items-center gap-2 text-slate-500 font-medium"><Shield size={24} className="text-indigo-600" /> <span>Secure Payments</span></div>
                <div className="flex items-center gap-2 text-slate-500 font-medium"><Zap size={24} className="text-amber-500" /> <span>Instant Activation</span></div>
                <div className="flex items-center gap-2 text-slate-500 font-medium"><CreditCard size={24} className="text-emerald-500" /> <span>UPI & Cards Accepted</span></div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
