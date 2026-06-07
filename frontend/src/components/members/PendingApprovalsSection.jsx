import React, { useState, useEffect, useCallback } from 'react';
import { Clock, UserCheck, UserX, RefreshCw, CheckCircle, XCircle, User, Phone, Calendar, Zap, ChevronDown, ChevronUp, AlertCircle, Tag, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import Input from '../Input';

// ─── Approve Registration Modal ────────────────────────────────────────────────
const ApproveRegistrationModal = ({ member, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        planDuration: '1',
        planName: '',
        totalFee: '',
        paidFee: '',
        joiningDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        paymentMethod: 'Cash'
    });
    const [gymPlans, setGymPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Compute expiry whenever joiningDate or planDuration changes
    useEffect(() => {
        if (form.joiningDate && form.planDuration) {
            const d = new Date(form.joiningDate);
            d.setMonth(d.getMonth() + Number(form.planDuration));
            setForm(prev => ({ ...prev, expiryDate: d.toISOString().split('T')[0] }));
        }
    }, [form.joiningDate, form.planDuration]);

    // Fetch gym plans on mount
    useEffect(() => {
        api.get('/api/plans')
            .then(res => {
                const activePlans = (res.data || []).filter(p => p.status !== 'Inactive');
                setGymPlans(activePlans);

                // Pre-fill with member's requested plan if available
                if (member.requestedPlanId && activePlans.length > 0) {
                    const requestedPlan = activePlans.find(
                        p => p._id === member.requestedPlanId?._id || p._id === member.requestedPlanId
                    );
                    if (requestedPlan) {
                        setForm(prev => ({
                            ...prev,
                            planName: requestedPlan.planName,
                            planDuration: String(requestedPlan.duration),
                            totalFee: String(requestedPlan.price)
                        }));
                    }
                }
            })
            .catch(() => setGymPlans([]))
            .finally(() => setPlansLoading(false));
    }, [member]);

    const handlePlanSelect = (plan) => {
        setForm(prev => ({
            ...prev,
            planName: plan.planName,
            planDuration: String(plan.duration),
            totalFee: String(plan.price)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (Number(form.paidFee) > Number(form.totalFee)) {
            setError('Paid fee cannot exceed total fee');
            return;
        }
        setLoading(true);
        try {
            await api.put(`/api/members/pending/${member._id}/approve`, {
                planDuration: Number(form.planDuration),
                planName: form.planName || null,
                totalFee: Number(form.totalFee),
                paidFee: Number(form.paidFee),
                joiningDate: form.joiningDate,
                expiryDate: form.expiryDate || undefined,
                paymentMethod: form.paymentMethod
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Approval failed');
        } finally {
            setLoading(false);
        }
    };

    const requestedPlan = member.requestedPlanId;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col"
            >
                <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <UserCheck size={18} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">Approve Registration</p>
                        <p className="text-xs text-slate-400">{member.name} — {member.mobile}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">✕</button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        {/* Member's Requested Plan Badge */}
                        {requestedPlan && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-2">
                                <Tag size={14} className="text-indigo-500 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-indigo-800">Member requested:</p>
                                    <p className="text-xs text-indigo-600">
                                        {requestedPlan.planName || 'A specific plan'}{requestedPlan.duration ? ` (${requestedPlan.duration}M)` : ''}{requestedPlan.price ? ` — ₹${requestedPlan.price}` : ''}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Plan selector */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Plan</label>
                            {plansLoading ? (
                                <div className="w-full h-12 bg-slate-100 rounded-xl animate-pulse" />
                            ) : gymPlans.length > 0 ? (
                                <>
                                    <select
                                        value={form.planName}
                                        onChange={e => {
                                            const plan = gymPlans.find(p => p.planName === e.target.value);
                                            if (plan) handlePlanSelect(plan);
                                            else setForm(prev => ({ ...prev, planName: '' }));
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select plan...</option>
                                        {gymPlans.map(p => (
                                            <option key={p._id} value={p.planName}>
                                                {p.planName} ({p.duration}M) — ₹{p.price}
                                            </option>
                                        ))}
                                    </select>
                                    {form.planName && (
                                        <p className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
                                            <Tag size={9} /> {form.planName} • {form.planDuration}M plan
                                        </p>
                                    )}
                                </>
                            ) : (
                                // Fallback: hardcoded durations if no plans configured
                                <select
                                    value={form.planDuration}
                                    onChange={e => setForm(prev => ({ ...prev, planDuration: e.target.value, planName: '' }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="1">1 Month</option>
                                    <option value="3">3 Months</option>
                                    <option value="6">6 Months</option>
                                    <option value="12">1 Year</option>
                                </select>
                            )}
                        </div>

                        {/* Joining Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Joining Date</label>
                            <input
                                type="date"
                                value={form.joiningDate}
                                onChange={e => setForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                required
                            />
                        </div>

                        {/* Expiry Date — auto-computed but editable */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                Expiry Date <span className="text-xs text-slate-400 font-normal">(auto-computed, editable)</span>
                            </label>
                            <input
                                type="date"
                                value={form.expiryDate}
                                onChange={e => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Total Fee (₹)</label>
                                <input
                                    type="number"
                                    value={form.totalFee}
                                    onChange={e => setForm(prev => ({ ...prev, totalFee: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    min="0"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Paid Now (₹)</label>
                                <input
                                    type="number"
                                    value={form.paidFee}
                                    onChange={e => setForm(prev => ({ ...prev, paidFee: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Payment Method</label>
                            <select
                                value={form.paymentMethod}
                                onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Online">Online</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? <><RefreshCw size={14} className="animate-spin" /> Approving...</> : <><CheckCircle size={14} /> Approve</>}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ title, subtitle, onClose, onConfirm, loading }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
        <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl border border-rose-200 shadow-2xl"
        >
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-slate-200" /></div>
            <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                    <XCircle size={24} className="text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all">Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                        {loading ? 'Rejecting...' : 'Reject'}
                    </button>
                </div>
            </div>
        </motion.div>
    </div>
);

// ─── Approve Fresh Start Modal (Full Renewal Form) ──────────────────────────
const ApproveFreshStartModal = ({ request, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        planDuration: String(request.planDuration || 1),
        planName: request.planName || '',
        totalFee: String(request.planPrice || ''),
        paidFee: '',
        paymentMethod: 'Cash',
        startDate: new Date().toISOString().split('T')[0]
    });
    const [gymPlans, setGymPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);

    // Compute expiry from startDate + planDuration
    const computedExpiry = (() => {
        try {
            const d = new Date(form.startDate);
            d.setMonth(d.getMonth() + Number(form.planDuration));
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return '—';
        }
    })();

    // Fetch gym plans on mount
    useEffect(() => {
        api.get('/api/plans')
            .then(res => setGymPlans((res.data || []).filter(p => p.status !== 'Inactive')))
            .catch(() => setGymPlans([]));
    }, []);

    const handlePlanSelect = (plan) => {
        setForm(prev => ({
            ...prev,
            planName: plan.planName,
            planDuration: String(plan.duration),
            totalFee: String(plan.price)
        }));
    };

    const handleApprove = async (e) => {
        e.preventDefault();
        setError('');
        if (Number(form.paidFee) > Number(form.totalFee)) {
            setError('Paid cannot exceed total fee');
            return;
        }
        setLoading(true);
        try {
            const res = await api.put(`/api/members/renewal-requests/${request._id}/approve`, {
                planDuration: Number(form.planDuration),
                planName: form.planName,
                totalFee: Number(form.totalFee),
                paidFee: Number(form.paidFee),
                paymentMethod: form.paymentMethod,
                startDate: form.startDate
            });
            setSuccessData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Approval failed');
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl border border-emerald-200 shadow-2xl"
                >
                    <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-slate-200" /></div>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-emerald-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">Fresh Start Approved! 🎉</h3>
                        <p className="text-xs text-slate-500 mb-4">{request.member?.name}'s membership is now active</p>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 space-y-2 text-left">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Plan</span>
                                <span className="font-semibold text-slate-800">{successData.planName || form.planName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">New Expiry</span>
                                <span className="font-bold text-emerald-700">
                                    {successData.expiryDate
                                        ? new Date(successData.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : computedExpiry}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Paid</span>
                                <span className="font-semibold text-slate-800">₹{form.paidFee || 0}</span>
                            </div>
                            {successData.dueAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Due</span>
                                    <span className="font-semibold text-amber-700">₹{successData.dueAmount}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => onSuccess()}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col"
            >
                <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0"><div className="w-10 h-1 rounded-full bg-slate-200" /></div>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Zap size={18} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">Approve Fresh Start</p>
                        <p className="text-xs text-slate-400">{request.member?.name} — Fill renewal details</p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">✕</button>
                </div>

                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleApprove} className="p-5 space-y-4">
                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        {/* Member's requested plan badge */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                            <Tag size={14} className="text-amber-500 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-amber-800">Member requested:</p>
                                <p className="text-xs text-amber-700">{request.planName} • {request.planDuration}M — ₹{request.planPrice?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Plan selector */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Plan</label>
                            {gymPlans.length > 0 ? (
                                <select
                                    value={form.planName}
                                    onChange={e => {
                                        const plan = gymPlans.find(p => p.planName === e.target.value);
                                        if (plan) handlePlanSelect(plan);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select plan...</option>
                                    {gymPlans.map(p => (
                                        <option key={p._id} value={p.planName}>
                                            {p.planName} ({p.duration}M) — ₹{p.price}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value={form.planDuration}
                                    onChange={e => setForm(prev => ({ ...prev, planDuration: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="1">1 Month</option>
                                    <option value="3">3 Months</option>
                                    <option value="6">6 Months</option>
                                    <option value="12">1 Year</option>
                                </select>
                            )}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Plan Start Date</label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                required
                            />
                            {form.startDate && (
                                <p className="text-xs text-indigo-600 mt-1">New expiry: <span className="font-semibold">{computedExpiry}</span></p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Total Fee (₹)</label>
                                <input
                                    type="number"
                                    value={form.totalFee}
                                    onChange={e => setForm(prev => ({ ...prev, totalFee: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    min="0"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Paid Now (₹)</label>
                                <input
                                    type="number"
                                    value={form.paidFee}
                                    onChange={e => setForm(prev => ({ ...prev, paidFee: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Payment Method</label>
                            <select
                                value={form.paymentMethod}
                                onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Online">Online</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? <><RefreshCw size={14} className="animate-spin" /> Approving...</> : <><Zap size={14} /> Approve</>}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PendingApprovalsSection = ({ onCountChange }) => {
    const [pendingMembers, setPendingMembers] = useState([]);
    const [freshStartRequests, setFreshStartRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);

    // Modal state
    const [approveModal, setApproveModal] = useState(null); // member object
    const [rejectModal, setRejectModal] = useState(null);   // { id, type, name }
    const [freshStartModal, setFreshStartModal] = useState(null); // request object
    const [rejectLoading, setRejectLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const [pendRes, fsRes] = await Promise.all([
                api.get('/api/members/pending'),
                api.get('/api/members/renewal-requests')
            ]);
            setPendingMembers(pendRes.data || []);
            setFreshStartRequests(fsRes.data || []);
            const total = (pendRes.data?.length || 0) + (fsRes.data?.length || 0);
            onCountChange?.(total);
        } catch (err) {
            console.error('Failed to fetch pending approvals', err);
        } finally {
            setLoading(false);
        }
    }, [onCountChange]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const totalCount = pendingMembers.length + freshStartRequests.length;

    const handleRejectRegistration = async () => {
        setRejectLoading(true);
        try {
            await api.put(`/api/members/pending/${rejectModal.id}/reject`);
            setRejectModal(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        } finally {
            setRejectLoading(false);
        }
    };

    const handleRejectFreshStart = async () => {
        setRejectLoading(true);
        try {
            await api.put(`/api/members/renewal-requests/${rejectModal.id}/reject`);
            setRejectModal(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        } finally {
            setRejectLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-48 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-32" />
            </div>
        );
    }

    if (totalCount === 0) return null;

    return (
        <>
            {/* Section Container */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                {/* Header Bar */}
                <button
                    onClick={() => setExpanded(p => !p)}
                    className="w-full flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock size={18} className="text-amber-600" />
                            </div>
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full px-1 animate-pulse">
                                {totalCount}
                            </span>
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-amber-900">Pending Approvals</p>
                            <p className="text-xs text-amber-600 font-medium">
                                {pendingMembers.length > 0 && `${pendingMembers.length} registration${pendingMembers.length > 1 ? 's' : ''}`}
                                {pendingMembers.length > 0 && freshStartRequests.length > 0 && ' • '}
                                {freshStartRequests.length > 0 && `${freshStartRequests.length} fresh start${freshStartRequests.length > 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                    {expanded ? <ChevronUp size={16} className="text-amber-600" /> : <ChevronDown size={16} className="text-amber-600" />}
                </button>

                {/* Cards */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 space-y-3">
                                {/* ── Pending Registration Cards ── */}
                                {pendingMembers.map(member => (
                                    <motion.div
                                        key={member._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                                    >
                                        {/* Type badge */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                                                New Registration
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                                {new Date(member.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                        {/* Member info */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                                {member.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Phone size={10} /> {member.mobile}
                                                    </span>
                                                    {member.city && (
                                                        <span className="text-xs text-slate-400">{member.city}</span>
                                                    )}
                                                </div>
                                                {/* Show requested plan if available */}
                                                {member.requestedPlanId?.planName && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Tag size={9} className="text-indigo-400" />
                                                        <span className="text-[11px] text-indigo-600 font-medium">
                                                            Wants: {member.requestedPlanId.planName}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Optional details row */}
                                        {(member.age || member.weight || member.height) && (
                                            <div className="flex gap-3 mb-3 bg-slate-50 rounded-xl p-2.5">
                                                {member.age && <span className="text-xs text-slate-500">Age: <b className="text-slate-700">{member.age}</b></span>}
                                                {member.weight && <span className="text-xs text-slate-500">Wt: <b className="text-slate-700">{member.weight}kg</b></span>}
                                                {member.height && <span className="text-xs text-slate-500">Ht: <b className="text-slate-700">{member.height}cm</b></span>}
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRejectModal({ id: member._id, type: 'registration', name: member.name })}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-all active:scale-[0.98]"
                                            >
                                                <XCircle size={13} /> Reject
                                            </button>
                                            <button
                                                onClick={() => setApproveModal(member)}
                                                className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <UserCheck size={13} /> Approve & Set Plan
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* ── Fresh Start Request Cards ── */}
                                {freshStartRequests.map(req => (
                                    <motion.div
                                        key={req._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                Fresh Start Request
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                                {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                                {req.member?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{req.member?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Phone size={10} /> {req.member?.mobile}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 rounded-xl p-3 mb-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-amber-700 font-semibold">{req.planName}</p>
                                                <p className="text-xs text-amber-600">{req.planDuration} month{req.planDuration > 1 ? 's' : ''}</p>
                                            </div>
                                            <p className="text-base font-black text-amber-800">₹{req.planPrice?.toLocaleString('en-IN')}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRejectModal({ id: req._id, type: 'freshstart', name: req.member?.name })}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-all active:scale-[0.98]"
                                            >
                                                <XCircle size={13} /> Reject
                                            </button>
                                            <button
                                                onClick={() => setFreshStartModal(req)}
                                                className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <Zap size={13} /> Approve Fresh Start
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ── Modals ── */}
            <AnimatePresence>
                {approveModal && (
                    <ApproveRegistrationModal
                        member={approveModal}
                        onClose={() => setApproveModal(null)}
                        onSuccess={() => { setApproveModal(null); fetchAll(); }}
                    />
                )}
                {rejectModal && (
                    <RejectModal
                        title={rejectModal.type === 'registration' ? 'Reject Registration?' : 'Reject Fresh Start?'}
                        subtitle={`Are you sure you want to reject ${rejectModal.name}'s request? This cannot be undone.`}
                        onClose={() => setRejectModal(null)}
                        onConfirm={rejectModal.type === 'registration' ? handleRejectRegistration : handleRejectFreshStart}
                        loading={rejectLoading}
                    />
                )}
                {freshStartModal && (
                    <ApproveFreshStartModal
                        request={freshStartModal}
                        onClose={() => setFreshStartModal(null)}
                        onSuccess={() => { setFreshStartModal(null); fetchAll(); }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default PendingApprovalsSection;
