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

    // Dynamically load Razorpay checkout script (removed from index.html to avoid render-blocking)
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
            // 1. Create Order
            const { data: orderData } = await api.post('/api/subscription/create-order', { planType });

            if (!orderData.success) {
                throw new Error("Failed to create order");
            }

            // 2. Configure Razorpay
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
                    color: "#9333ea"
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
        <div className="max-w-6xl mx-auto py-8 text-gray-100">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
                    Upgrade Your Gym Experience
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Get uninterrupted access to TrackON's powerful dashboard, member management, and advanced analytics.
                </p>
            </div>

            {/* Status Section */}
            <div className={`mb-12 p-6 rounded-2xl border backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-center justify-between transition-all ${user?.planStatus === 'EXPIRED' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-800/60 border-gray-700'}`}>
                <div>
                    <h2 className="text-2xl justify-center md:justify-start font-bold flex items-center gap-2 mb-2">
                        {user?.planStatus === 'ACTIVE' ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}
                        Current Status
                    </h2>
                    <p className={`text-lg font-medium ${user?.planStatus === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                        {user?.planStatus === 'ACTIVE' ? 'Active Subscription' : 'Expired'}
                    </p>
                    {user?.planExpiryDate && (
                        <p className="text-gray-400 mt-1">
                            {user?.planStatus === 'ACTIVE' ? `Expires in ${daysUntilExpiry} days (${new Date(user.planExpiryDate).toLocaleDateString()})` : `Expired on ${new Date(user.planExpiryDate).toLocaleDateString()}`}
                        </p>
                    )}
                </div>
                {user?.planStatus === 'EXPIRED' && (
                    <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end gap-3">
                        <div className="px-4 py-2 bg-red-500/10 text-red-300 rounded-lg border border-red-500/20 font-semibold animate-pulse">
                            Action Required: Renew to restore access
                        </div>
                        <button 
                            onClick={handleCheckStatus} 
                            className="text-sm px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 text-white transition-colors flex items-center gap-2"
                        >
                            <RefreshCcw size={16}/> Offline Admin Renewal? Check Status
                        </button>
                    </div>
                )}
            </div>

            {/* Messages */}
            {!settingsLoading && !settings.isOnlinePaymentEnabled && (
                <div className="mb-8 p-5 bg-red-900/30 border-2 border-red-500/50 rounded-xl flex items-start gap-4 text-red-200 max-w-2xl mx-auto shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={28} />
                    <div>
                        <h3 className="font-bold text-red-400 text-lg mb-1">Online Renewals Disabled</h3>
                        <p>{settings.subscriptionMessage || "Online payment is currently stopped. Please connect with admin for plan renewal."}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400 max-w-2xl mx-auto">
                    <AlertCircle className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/50 rounded-xl flex flex-col items-center justify-center text-center gap-3 text-white max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-300 shadow-xl shadow-green-900/20">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center -mt-10 shadow-lg mb-2 border-4 border-gray-900">
                        <CheckCircle2 size={32} className="text-white" />
                    </div>
                    <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-400">{successMessage}</p>
                    <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-2 bg-white text-green-600 rounded-full font-bold hover:bg-gray-100 transition-colors cursor-pointer z-10 block">
                        Go to Dashboard Now
                    </button>
                    <p className="text-sm mt-1 opacity-75 text-green-200 animate-pulse">Auto-redirecting...</p>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col ${plan.popular
                            ? 'bg-gradient-to-b from-purple-600/20 to-gray-800 border-2 border-purple-500 shadow-purple-900/30'
                            : 'bg-gray-800 border-2 border-transparent hover:border-gray-600'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 inset-x-0 mx-auto justify-center flex">
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-b-xl inline-block shadow-lg">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        <div className="p-8 pt-12 flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">{plan.title}</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                                <span className="text-gray-400 font-medium">{plan.duration}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                                        <CheckCircle2 size={20} className={plan.popular ? 'text-purple-400' : 'text-gray-500'} />
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
                                    ? 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'
                                    : plan.popular
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/50'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                    } ${(loadingPlan !== null) && settings.isOnlinePaymentEnabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {!settingsLoading && !settings.isOnlinePaymentEnabled ? (
                                    <>
                                        <AlertCircle size={20} className="text-gray-500" />
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
            <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
                <div className="flex items-center gap-2 text-gray-400"><Shield size={24} /> <span>Secure Payments</span></div>
                <div className="flex items-center gap-2 text-gray-400"><Zap size={24} /> <span>Instant Activation</span></div>
                <div className="flex items-center gap-2 text-gray-400"><CreditCard size={24} /> <span>UPI & Cards Accepted</span></div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
