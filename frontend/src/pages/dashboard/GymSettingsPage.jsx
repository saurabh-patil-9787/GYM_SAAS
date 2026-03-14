import React, { useEffect, useState, useRef } from 'react';
import api, { getAccessToken } from '../../api/axios';
import Input from '../../components/Input';
import { Save, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ImageCropper from '../../components/ImageCropper';

const GymSettingsPage = () => {
    const { user, updateUser } = useAuth();
    const [gymData, setGymData] = useState({
        gymName: '',
        city: '',
        pincode: '',
        logoUrl: ''
    });
    const [emailData, setEmailData] = useState(user?.email || '');
    const [emailSaving, setEmailSaving] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [removeLogoFlag, setRemoveLogoFlag] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchGym = async () => {
            try {
                const res = await api.get(`/api/gym/me?t=${Date.now()}`);
                setGymData({
                    gymName: res.data.gymName || '',
                    city: res.data.city || '',
                    pincode: res.data.pincode || '',
                    logoUrl: res.data.logoUrl || ''
                });
                if (res.data.logoUrl) {
                    setLogoPreview(res.data.logoUrl);
                }
            } catch (error) {
                console.error("Failed to fetch gym");
            } finally {
                setLoading(false);
            }
        };

        fetchGym();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGymData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const [showCropModal, setShowCropModal] = useState(false);
    const [cropImageFile, setCropImageFile] = useState(null);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('File size should be less than 2MB');
                return;
            }
            // Instead of setting directly, open the cropper
            setCropImageFile(file);
            setShowCropModal(true);
            
            // Clear input so same file can be selected again if canceled
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCropComplete = (croppedFile) => {
        setLogoFile(croppedFile);
        setLogoPreview(URL.createObjectURL(croppedFile));
        setRemoveLogoFlag(false);
        setShowCropModal(false);
        setCropImageFile(null);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setCropImageFile(null);
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setGymData(prev => ({ ...prev, logoUrl: '' }));
        setRemoveLogoFlag(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('gymName', gymData.gymName);
            formData.append('city', gymData.city);
            formData.append('pincode', gymData.pincode);
            
            if (logoFile) {
                formData.append('logo', logoFile);
            } else if (removeLogoFlag) {
                formData.append('removeLogo', 'true');
            }

            const token = getAccessToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gym/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update gym details');
            }
            
            const responseData = await res.json();

            alert('Gym details updated successfully!');
            const updatedLogo = responseData.logoUrl;
            if (updatedLogo) {
               const bustedLogo = updatedLogo + '?t=' + Date.now();
               setGymData(prev => ({ ...prev, logoUrl: bustedLogo }));
               setLogoPreview(bustedLogo);
               updateUser({ gymLogoUrl: bustedLogo });
            } else {
               updateUser({ gymLogoUrl: null });
            }
        } catch (error) {
            alert(error.message || error.response?.data?.message || 'Failed to update gym details');
        } finally {
            setSaving(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailSaving(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gym-owner/update-email`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailData })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update email');
            }

            const responseData = await res.json();
            alert('Email updated successfully!');
            updateUser({ email: responseData.email });
        } catch (error) {
            alert(error.message || 'Failed to update email');
        } finally {
            setEmailSaving(false);
        }
    };

    if (loading) return <div className="text-gray-400">Loading Settings...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Gym Settings</h2>

            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Upload Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-700">
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-900 overflow-hidden relative group">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Gym Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-gray-500" size={32} />
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h3 className="text-white font-medium">Gym Logo</h3>
                                <p className="text-sm text-gray-400">Upload a square logo for your gym. Max size 2MB (jpg/png).</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                                    <Upload size={16} /> 
                                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                </button>
                                {logoPreview && (
                                    <button type="button" onClick={handleRemoveLogo} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                                        <Trash2 size={16} /> Remove
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/jpeg, image/png, image/jpg" className="hidden" />
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Gym Name"
                        name="gymName"
                        value={gymData.gymName}
                        onChange={handleChange}
                        required
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <Input
                            label="City"
                            name="city"
                            value={gymData.city}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Pincode"
                            name="pincode"
                            value={gymData.pincode}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save size={20} />
                        {saving ? 'Saving Gym...' : 'Save Gym Details'}
                    </button>
                </form>
            </div>

            <h2 className="text-2xl font-bold text-white mt-12 mb-8">Account Settings</h2>
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 mb-12">
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <Input
                        label="Recovery Email Address"
                        name="email"
                        type="email"
                        value={emailData}
                        onChange={(e) => setEmailData(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                    />
                    <button
                        type="submit"
                        disabled={emailSaving}
                        className={`bg-purple-600 hover:bg-purple-700 w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${emailSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save size={20} />
                        {emailSaving ? 'Saving Email...' : 'Update Email'}
                    </button>
                </form>
            </div>

            {/* Cropper Modal */}
            {showCropModal && cropImageFile && (
                <ImageCropper
                    imageFile={cropImageFile}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
};

export default GymSettingsPage;
