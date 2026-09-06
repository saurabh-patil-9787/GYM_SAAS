import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
    'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
    'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
    'Puducherry','Chandigarh','Lakshadweep','Andaman & Nicobar Islands','Dadra & Nagar Haveli'
];

const InvoiceSettings = () => {
    const [settings, setSettings] = useState({
        address: '', mobile: '', email: '',
        gstEnabled: false, gstin: '', state: '', stateCode: '', gstRate: 18,
        invoicePrefix: 'INV', terms: '', footerNote: ''
    });
    const [gymName, setGymName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/api/invoices/settings')
            .then(res => {
                setGymName(res.data.gymName || '');
                setLogoUrl(res.data.logoUrl || '');
                setSettings(prev => ({ ...prev, ...(res.data.invoiceSettings || {}) }));
            })
            .catch(() => setError('Failed to load settings'))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (settings.gstEnabled && !settings.gstin.trim()) {
            setError('GSTIN is required when GST is enabled.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await api.put('/api/invoices/settings', settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full border border-slate-200 bg-white text-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";
    const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider";

    if (loading) return (
        <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Invoice Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Configure your gym's invoice information. These settings appear on every generated invoice.</p>
            </div>

            {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
                    {error}
                </div>
            )}
            {saved && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Settings saved successfully!
                </motion.div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Gym Info (read-only) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Gym Identity</h3>
                    <div className="flex items-center gap-4 mb-4">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-200" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                                {gymName?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-slate-800">{gymName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Logo and gym name are managed in Gym Settings</p>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">Contact Information</h3>
                    <div>
                        <label className={labelCls}>Address</label>
                        <textarea name="address" value={settings.address || ''} onChange={handleChange}
                            placeholder="123 Gym Street, Pune, Maharashtra 411001" rows={2}
                            className={`${inputCls} resize-none`} maxLength={200} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Mobile</label>
                            <input type="text" name="mobile" value={settings.mobile || ''} onChange={handleChange}
                                placeholder="9876543210" className={inputCls} maxLength={15} />
                        </div>
                        <div>
                            <label className={labelCls}>Email</label>
                            <input type="email" name="email" value={settings.email || ''} onChange={handleChange}
                                placeholder="gym@example.com" className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Invoice Prefix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Invoice Numbering</h3>
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div>
                            <label className={labelCls}>Invoice Prefix</label>
                            <input type="text" name="invoicePrefix" value={settings.invoicePrefix || 'INV'} onChange={handleChange}
                                placeholder="INV" className={inputCls} maxLength={10} />
                        </div>
                        <div className="pb-0.5">
                            <p className="text-xs text-slate-400">Example:</p>
                            <p className="text-sm font-bold text-indigo-600">
                                {(settings.invoicePrefix || 'INV')}/{new Date().getFullYear()}/00001
                            </p>
                        </div>
                    </div>
                </div>

                {/* GST */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-700">GST Configuration</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="gstEnabled" checked={!!settings.gstEnabled} onChange={handleChange}
                                className="w-4 h-4 accent-indigo-600" />
                            <span className="text-sm font-semibold text-slate-700">GST Registered</span>
                        </label>
                    </div>
                    {settings.gstEnabled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            <div>
                                <label className={labelCls}>GSTIN *</label>
                                <input type="text" name="gstin" value={settings.gstin || ''} onChange={handleChange}
                                    placeholder="22AAAAA0000A1Z5" className={inputCls} maxLength={15} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>State</label>
                                    <select name="state" value={settings.state || ''} onChange={handleChange} className={inputCls}>
                                        <option value="">Select state</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>State Code</label>
                                    <input type="text" name="stateCode" value={settings.stateCode || ''} onChange={handleChange}
                                        placeholder="27" className={inputCls} maxLength={4} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Default GST Rate (%)</label>
                                <select name="gstRate" value={settings.gstRate || 18} onChange={handleChange} className={inputCls}>
                                    {[5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                                </select>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">Invoice Footer</h3>
                    <div>
                        <label className={labelCls}>Terms & Conditions</label>
                        <textarea name="terms" value={settings.terms || ''} onChange={handleChange}
                            placeholder="Membership fees once paid are non-refundable and subject to gym policies."
                            rows={3} className={`${inputCls} resize-none`} maxLength={500} />
                    </div>
                    <div>
                        <label className={labelCls}>Footer Note</label>
                        <input type="text" name="footerNote" value={settings.footerNote || ''} onChange={handleChange}
                            placeholder="Thank you for choosing us!" className={inputCls} maxLength={150} />
                    </div>
                </div>

                <button type="submit" disabled={saving}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Invoice Settings</>}
                </button>
            </form>
        </div>
    );
};

export default InvoiceSettings;
