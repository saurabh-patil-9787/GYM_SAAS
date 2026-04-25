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
            <div className="bg-[#13131f] p-6 md:p-8 rounded-3xl border border-white/[0.05] shadow-2xl relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="flex items-start justify-between flex-col md:flex-row gap-6 mb-8 border-b border-white/[0.05] pb-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2 tracking-tight">
                            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/[0.08] p-2 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                <ShieldAlert className="text-purple-400" size={20} />
                            </div>
                            Global Subscription Control
                        </h2>
                        <p className="text-gray-400 text-sm max-w-xl">
                            Instantly toggle online payment processing for all tenants across the SaaS platform. This affects all checkout flows.
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border text-sm font-bold shadow-lg uppercase tracking-wider ${isEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10'}`}>
                        {isEnabled ? <CheckCircle2 size={16} /> : <PowerOff size={16} />}
                        {isEnabled ? "Payments Active" : "Payments Disabled"}
                    </div>
                </div>

                <div className="space-y-8 relative z-10">
                    {/* Master Toggle */}
                    <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 shadow-inner">
                        <div>
                            <h3 className="text-base font-bold text-white mb-1">Enable Online Collections</h3>
                            <p className="text-sm text-gray-500">Turn off to completely lock the frontend subscription upgrade flows.</p>
                        </div>
                        <button
                            onClick={() => handleSave(!isEnabled)}
                            disabled={saving}
                            className={`relative w-16 h-8 rounded-full transition-colors duration-300 shadow-inner ${isEnabled ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border border-emerald-400/50' : 'bg-gray-700 border border-gray-600'} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${isEnabled ? 'translate-x-8' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    {/* Custom Message Config */}
                    <div>
                        <label className="block text-gray-300 font-bold mb-3 text-sm">
                            Disabled Reason / Custom Message <span className="text-xs font-normal text-gray-500 ml-2">(Visible to gyms when payments are disabled)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="w-full bg-[#13131f] border border-white/[0.08] text-white p-4 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all shadow-inner placeholder-gray-600 text-sm"
                            placeholder="Example: We are undergoing scheduled emergency maintenance on the payment gateway..."
                        />
                    </div>

                    <button 
                        onClick={() => handleSave(isEnabled)}
                        disabled={saving}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-[0.98]"
                    >
                        <Save size={20} /> {saving ? "Saving..." : "Save Configuration"}
                    </button>
                </div>
            </div>
            
            {/* Audit hint */}
            <p className="text-center text-xs text-gray-600 font-medium">
                All changes made here are logged with your Admin ID for audit trailing.
            </p>
        </div>
    );
};

export default AdminSubscriptionSettings;
