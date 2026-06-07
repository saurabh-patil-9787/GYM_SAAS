import React, { useEffect, useState, useRef } from 'react';
import api, { getAccessToken } from '../../api/axios';
import Input from '../../components/Input';
import { Save, Upload, Trash2, Image as ImageIcon, CreditCard, Bell, Eye, EyeOff, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import ImageCropper from '../../components/ImageCropper';
import { compressImage } from '../../utils/compressImage';
import { useImageUpload } from '../../hooks/useImageUpload';
import { requestNotificationPermission, getNotificationStatus, isFirebaseConfigured } from '../../utils/firebase';

const GymSettingsPage = () => {
    const { user, updateUser } = useAuth();
    const [gymData, setGymData] = useState({ gymName: '', city: '', pincode: '', logoUrl: '' });
    const [emailData, setEmailData] = useState(user?.email || '');
    const [emailSaving, setEmailSaving] = useState(false);
    const { showCropModal, cropImageFile, previewUrl: logoPreview, finalFile: logoFile, handleFileSelect, handleCropComplete, closeCropModal: handleCropCancel, resetUpload, setInitialPreview } = useImageUpload();
    const [removeLogoFlag, setRemoveLogoFlag] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    // Razorpay config state
    const [razorpayConfig, setRazorpayConfig] = useState({ razorpayKeyId: '', razorpayKeySecret: '', onlinePaymentsEnabled: false });
    const [showSecret, setShowSecret] = useState(false);
    const [razorpaySaving, setRazorpaySaving] = useState(false);
    const [razorpayMsg, setRazorpayMsg] = useState('');

    // Push notification state
    const [notifStatus, setNotifStatus] = useState('default');
    const [notifRequesting, setNotifRequesting] = useState(false);

    useEffect(() => {
        const fetchGym = async () => {
            try {
                const [gymRes, rpRes] = await Promise.all([
                    api.get(`/api/gym/me?t=${Date.now()}`),
                    api.get('/api/gym/razorpay-config').catch(() => ({ data: {} }))
                ]);
                setGymData({ gymName: gymRes.data.gymName || '', city: gymRes.data.city || '', pincode: gymRes.data.pincode || '', logoUrl: gymRes.data.logoUrl || '' });
                if (gymRes.data.logoUrl) setInitialPreview(gymRes.data.logoUrl);
                setRazorpayConfig({
                    razorpayKeyId: rpRes.data?.razorpayKeyId || '',
                    razorpayKeySecret: '',
                    onlinePaymentsEnabled: rpRes.data?.onlinePaymentsEnabled || false,
                    hasSecret: rpRes.data?.hasSecret || false
                });
            } catch (error) { console.error("Failed to fetch gym"); }
            finally { setLoading(false); }
        };
        fetchGym();
        const currentStatus = getNotificationStatus();
        setNotifStatus(currentStatus);
        
        if (currentStatus === 'granted') {
            requestNotificationPermission('/api/auth/fcm-token');
        }
    }, []);

    const handleChange = (e) => { const { name, value } = e.target; setGymData(prev => ({ ...prev, [name]: value })); };

    const handleRemoveLogo = () => { resetUpload(); setGymData(prev => ({ ...prev, logoUrl: '' })); setRemoveLogoFlag(true); if (fileInputRef.current) fileInputRef.current.value = ''; };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('gymName', gymData.gymName);
            formData.append('city', gymData.city);
            formData.append('pincode', gymData.pincode);
            if (logoFile) formData.append('logo', logoFile);
            else if (removeLogoFlag) formData.append('removeLogo', 'true');
            const token = getAccessToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gym/me`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.message || 'Failed to update gym details'); }
            const responseData = await res.json();
            alert('Gym details updated successfully!');
            const updatedLogo = responseData.logoUrl;
            if (updatedLogo) { const bustedLogo = updatedLogo + '?t=' + Date.now(); setGymData(prev => ({ ...prev, logoUrl: bustedLogo })); setInitialPreview(bustedLogo); updateUser({ gymLogoUrl: bustedLogo }); }
            else { updateUser({ gymLogoUrl: null }); }
        } catch (error) { alert(error.message || error.response?.data?.message || 'Failed to update gym details'); }
        finally { setSaving(false); }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailSaving(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gym-owner/update-email`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ email: emailData }) });
            if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.message || 'Failed to update email'); }
            const responseData = await res.json();
            alert('Email updated successfully!');
            updateUser({ email: responseData.email });
        } catch (error) { alert(error.message || 'Failed to update email'); }
        finally { setEmailSaving(false); }
    };

    const handleRazorpaySave = async (e) => {
        e.preventDefault();
        setRazorpaySaving(true);
        setRazorpayMsg('');
        try {
            const payload = {
                razorpayKeyId: razorpayConfig.razorpayKeyId,
                onlinePaymentsEnabled: razorpayConfig.onlinePaymentsEnabled
            };
            if (razorpayConfig.razorpayKeySecret) {
                payload.razorpayKeySecret = razorpayConfig.razorpayKeySecret;
            }
            await api.put('/api/gym/razorpay-config', payload);
            setRazorpayMsg('Razorpay configuration saved!');
            setRazorpayConfig(prev => ({ ...prev, razorpayKeySecret: '', hasSecret: !!payload.razorpayKeySecret || prev.hasSecret }));
            setTimeout(() => setRazorpayMsg(''), 3000);
        } catch (error) {
            setRazorpayMsg(error.response?.data?.message || 'Failed to save Razorpay config');
        } finally {
            setRazorpaySaving(false);
        }
    };

    const handleEnableNotifications = async () => {
        setNotifRequesting(true);
        const success = await requestNotificationPermission('/api/auth/fcm-token');
        setNotifStatus(getNotificationStatus());
        setNotifRequesting(false);
        if (success) alert('Push notifications enabled!');
    };

    if (loading) return <BicepCurlLoader text="Loading Settings..." fullScreen={false} />;

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Gym Settings</h2>

            {/* Plan Details Card */}
            <div className={`mb-8 p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center bg-white shadow-sm ${user?.planStatus === 'EXPIRED' ? 'border-rose-300' : 'border-slate-200'}`}>
                <div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">Subscription Plan</h3>
                    {user?.planExpiryDate ? (
                        <p className="text-slate-500 text-sm">
                            Status: <span className={`font-semibold ${user.planStatus === 'EXPIRED' ? 'text-rose-500' : 'text-emerald-500'}`}>{user.planStatus}</span>
                            {' '}• Expires on: <span className="text-slate-800 font-medium">{new Date(user.planExpiryDate).toLocaleDateString()}</span>
                        </p>
                    ) : (
                        <p className="text-slate-400 text-sm">Loading plan details...</p>
                    )}
                </div>
                {user?.planStatus === 'EXPIRED' && (
                    <div className="mt-4 md:mt-0 px-4 py-2 bg-rose-50 text-rose-500 rounded-xl border border-rose-200 font-bold text-xs uppercase tracking-wider animate-pulse">Plan Expired</div>
                )}
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {/* Logo Upload Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
                        <div className="w-24 h-24 rounded-2xl border border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative group shadow-inner">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Gym Logo" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            ) : (
                                <ImageIcon className="text-slate-400" size={32} strokeWidth={1.5} />
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h3 className="text-slate-800 font-semibold text-sm">Gym Logo</h3>
                                <p className="text-xs text-slate-400 mt-1">Upload a square logo. Max size 2MB (jpg/png).</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border border-slate-200">
                                    <Upload size={14} /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                </button>
                                {logoPreview && (
                                    <button type="button" onClick={handleRemoveLogo} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border border-rose-200">
                                        <Trash2 size={14} /> Remove
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={(e) => { handleFileSelect(e.target.files[0]); e.target.value = ''; }} accept="image/jpeg, image/png, image/jpg" className="hidden" />
                            </div>
                        </div>
                    </div>

                    <Input label="Gym Name" name="gymName" value={gymData.gymName} onChange={handleChange} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input label="City" name="city" value={gymData.city} onChange={handleChange} required />
                        <Input label="Pincode" name="pincode" value={gymData.pincode} onChange={handleChange} required />
                    </div>

                    <button type="submit" disabled={saving} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm mt-8 active:scale-[0.98] ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Gym Details'}
                    </button>
                </form>
            </div>

            {/* Razorpay Payment Configuration */}
            <h2 className="text-xl font-bold text-slate-800 mt-12 mb-6 tracking-tight flex items-center gap-2">
                <CreditCard size={20} className="text-indigo-500" /> Payment Configuration
            </h2>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden mb-8">
                <p className="text-xs text-slate-400 mb-6">Enter your Razorpay credentials so members can pay online directly to your bank account. Get your keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Razorpay Dashboard</a>.</p>
                
                {razorpayMsg && (
                    <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${razorpayMsg.includes('saved') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        <Check size={14} /> {razorpayMsg}
                    </div>
                )}

                <form onSubmit={handleRazorpaySave} className="space-y-5">
                    {/* Test/Live Mode Indicator */}
                    {razorpayConfig.razorpayKeyId && (
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold ${
                            razorpayConfig.razorpayKeyId.startsWith('rzp_live_')
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                            {razorpayConfig.razorpayKeyId.startsWith('rzp_live_')
                                ? <><ShieldCheck size={14} className="flex-shrink-0" /> Live Mode — Payments go directly to your bank account</>  
                                : <><AlertTriangle size={14} className="flex-shrink-0" /> Test Mode — No real money is collected. Use live keys for production.</>  
                            }
                        </div>
                    )}
                    <div className="relative">
                        <Input
                            label="Razorpay Key ID"
                            name="razorpayKeyId"
                            value={razorpayConfig.razorpayKeyId}
                            onChange={(e) => setRazorpayConfig(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                            placeholder="rzp_live_xxxxxxxxxxxxx or rzp_test_xxxxxxxxxxxxx"
                        />
                    </div>
                    <div className="relative">
                        <Input
                            label={razorpayConfig.hasSecret ? 'Razorpay Key Secret (already set — enter new to update)' : 'Razorpay Key Secret'}
                            name="razorpayKeySecret"
                            type={showSecret ? 'text' : 'password'}
                            value={razorpayConfig.razorpayKeySecret}
                            onChange={(e) => setRazorpayConfig(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                            placeholder={razorpayConfig.hasSecret ? '••••••••••• (unchanged)' : 'Enter your key secret'}
                        />
                        <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-9 text-slate-400 hover:text-slate-600">
                            {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Online Payments Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Accept Online Payments</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Members can pay for plans directly via Razorpay</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setRazorpayConfig(prev => ({ ...prev, onlinePaymentsEnabled: !prev.onlinePaymentsEnabled }))}
                            className={`w-12 h-7 rounded-full transition-colors relative ${razorpayConfig.onlinePaymentsEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${razorpayConfig.onlinePaymentsEnabled ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    <button type="submit" disabled={razorpaySaving} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] ${razorpaySaving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <Save size={18} /> {razorpaySaving ? 'Saving...' : 'Save Payment Config'}
                    </button>
                </form>
            </div>

            {/* Push Notifications */}
            <h2 className="text-xl font-bold text-slate-800 mt-12 mb-6 tracking-tight flex items-center gap-2">
                <Bell size={20} className="text-indigo-500" /> Push Notifications
            </h2>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden mb-8">
                <p className="text-xs text-slate-400 mb-4">Get instant alerts when members register, make payments, or request renewals.</p>
                {notifStatus === 'granted' ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <Check size={18} className="text-emerald-500" />
                        <p className="text-sm font-semibold text-emerald-700">Push notifications are enabled</p>
                    </div>
                ) : notifStatus === 'denied' ? (
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                        <p className="text-sm font-semibold text-rose-700">Notifications blocked</p>
                        <p className="text-xs text-rose-500 mt-1">Please enable notifications in your browser settings.</p>
                    </div>
                ) : (
                    <button
                        onClick={handleEnableNotifications}
                        disabled={notifRequesting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
                    >
                        <Bell size={18} /> {notifRequesting ? 'Requesting...' : 'Enable Push Notifications'}
                    </button>
                )}
            </div>

            <h2 className="text-xl font-bold text-slate-800 mt-12 mb-6 tracking-tight">Account Settings</h2>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden mb-12">
                <form onSubmit={handleEmailSubmit} className="space-y-6 relative z-10">
                    <Input label="Recovery Email Address" name="email" type="email" value={emailData} onChange={(e) => setEmailData(e.target.value)} placeholder="your.email@example.com" required />
                    <button type="submit" disabled={emailSaving} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm mt-4 active:scale-[0.98] ${emailSaving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <Save size={18} /> {emailSaving ? 'Updating...' : 'Update Email'}
                    </button>
                </form>
            </div>

            {showCropModal && cropImageFile && (
                <ImageCropper imageFile={cropImageFile} onCropComplete={handleCropComplete} onCancel={handleCropCancel} />
            )}
        </div>
    );
};


export default GymSettingsPage;
