import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Power, PowerOff, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';

const AdminSubscriptionSettings = () => {
    const [isEnabled, setIsEnabled] = useState(true);
    const [message, setMessage] = useState("Online payment is currently stopped. Please connect with admin for plan renewal.");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/settings');
                if (res.data.success && res.data.settings) {
                    setIsEnabled(res.data.settings.isOnlinePaymentEnabled);
                    setMessage(res.data.settings.subscriptionMessage);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (forceEnabledStatus = null) => {
        const newStatus = forceEnabledStatus !== null ? forceEnabledStatus : isEnabled;
        
        if (newStatus === false) {
            const confirmDisable = window.confirm(
                "⚠️ ARE YOU SURE?\n\nThis will disable online payments globally for ALL gyms. Gym owners will not be able to renew their plans online until you re-enable this feature."
            );
            if (!confirmDisable) return;
        }

        setSaving(true);
        try {
            await api.put('/api/settings/subscription', {
                isOnlinePaymentEnabled: newStatus,
                subscriptionMessage: message
            });
            setIsEnabled(newStatus);
            alert("Settings updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-400">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-700 shadow-xl">
                <div className="flex items-start justify-between flex-col md:flex-row gap-6 mb-8 border-b border-gray-700 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                            <ShieldAlert className="text-purple-500" /> Global Subscription Control
                        </h2>
                        <p className="text-gray-400 max-w-xl">
                            Instantly toggle online payment processing for all tenants across the SaaS platform. This affects all Razorpay/Stripe checkout flows.
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 border font-bold ${isEnabled ? 'bg-green-500/10 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
                        {isEnabled ? <CheckCircle2 size={20} /> : <PowerOff size={20} />}
                        {isEnabled ? "Payments Active" : "Payments Disabled"}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Master Toggle */}
                    <div className="flex items-center justify-between p-6 bg-gray-900 rounded-xl border border-gray-700">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Enable Online Collections</h3>
                            <p className="text-sm text-gray-400">Turn off to completely lock the frontend subscription upgrade flows.</p>
                        </div>
                        <button
                            onClick={() => handleSave(!isEnabled)}
                            disabled={saving}
                            className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isEnabled ? 'bg-green-500' : 'bg-gray-600'} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${isEnabled ? 'translate-x-8' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Custom Message Config */}
                    <div>
                        <label className="block text-gray-300 font-bold mb-3">
                            Disabled Reason / Custom Message <span className="text-sm font-normal text-gray-500 ml-2">(Visible to gyms when payments are disabled)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-600"
                            placeholder="Example: We are undergoing scheduled emergency maintenance on the payment gateway..."
                        />
                    </div>

                    <button 
                        onClick={() => handleSave(isEnabled)}
                        disabled={saving}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> {saving ? "Saving..." : "Save Configuration"}
                    </button>
                </div>
            </div>
            
            {/* Audit hint */}
            <p className="text-center text-xs text-gray-500">
                All changes made here are logged with your Admin ID for audit trailing.
            </p>
        </div>
    );
};

export default AdminSubscriptionSettings;
