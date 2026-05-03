import React, { useEffect, useState, useRef } from 'react';
import api, { getAccessToken } from '../../api/axios';
import Input from '../../components/Input';
import { Save, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import ImageCropper from '../../components/ImageCropper';
import { compressImage } from '../../utils/compressImage';
import { useImageUpload } from '../../hooks/useImageUpload';

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

    useEffect(() => {
        const fetchGym = async () => {
            try {
                const res = await api.get(`/api/gym/me?t=${Date.now()}`);
                setGymData({ gymName: res.data.gymName || '', city: res.data.city || '', pincode: res.data.pincode || '', logoUrl: res.data.logoUrl || '' });
                if (res.data.logoUrl) setInitialPreview(res.data.logoUrl);
            } catch (error) { console.error("Failed to fetch gym"); }
            finally { setLoading(false); }
        };
        fetchGym();
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
