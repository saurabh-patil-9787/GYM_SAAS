import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Edit3, Trash2, X, Check, AlertCircle, RefreshCw, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const OwnerPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({ planName: '', duration: '1', price: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Renewal requests
    const [renewalRequests, setRenewalRequests] = useState([]);
    const [processing, setProcessing] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [plansRes, requestsRes] = await Promise.all([
                api.get('/api/plans'),
                api.get('/api/members/renewal-requests')
            ]);
            setPlans(plansRes.data);
            setRenewalRequests(requestsRes.data);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingPlan) {
                await api.put(`/api/plans/${editingPlan._id}`, formData);
                setSuccess('Plan updated successfully');
            } else {
                await api.post('/api/plans', formData);
                setSuccess('Plan created successfully');
            }
            resetForm();
            await fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save plan');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            planName: plan.planName,
            duration: String(plan.duration),
            price: String(plan.price)
        });
        setShowForm(true);
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Deactivate this plan? Members will no longer see it.')) return;

        try {
            await api.delete(`/api/plans/${planId}`);
            setSuccess('Plan deactivated');
            await fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to deactivate plan');
        }
    };

    const handleToggleStatus = async (plan) => {
        try {
            await api.put(`/api/plans/${plan._id}`, {
                status: plan.status === 'Active' ? 'Inactive' : 'Active'
            });
            await fetchData();
        } catch (err) {
            setError('Failed to update plan status');
        }
    };

    const handleApproveRenewal = async (requestId) => {
        setProcessing(requestId);
        try {
            await api.put(`/api/members/renewal-requests/${requestId}/approve`);
            setSuccess('Fresh Start approved');
            await fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve');
        } finally {
            setProcessing(null);
        }
    };

    const handleRejectRenewal = async (requestId) => {
        setProcessing(requestId);
        try {
            await api.put(`/api/members/renewal-requests/${requestId}/reject`, { reason: '' });
            setSuccess('Request rejected');
            await fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject');
        } finally {
            setProcessing(null);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingPlan(null);
        setFormData({ planName: '', duration: '1', price: '' });
    };

    const getDurationLabel = (months) => {
        if (months === 1) return '1 Month';
        if (months === 3) return '3 Months';
        if (months === 6) return '6 Months';
        if (months === 12) return '1 Year';
        return `${months} Months`;
    };

    if (loading) return <BicepCurlLoader text="Loading Plans..." fullScreen={false} />;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-fade-in">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Membership Plans</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Configure plans visible to your members</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm self-start sm:self-auto"
                >
                    <Plus size={16} />
                    Add Plan
                </button>
            </div>

            {/* Messages */}
            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                        <Check size={16} className="text-emerald-500" />
                        <p className="text-xs font-semibold text-emerald-700">{success}</p>
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500" />
                        <p className="text-xs font-semibold text-rose-700">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Renewal Requests */}
            {renewalRequests.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-amber-500" />
                        Pending Fresh Start Requests ({renewalRequests.length})
                    </h2>
                    <div className="space-y-3">
                        {renewalRequests.map(req => (
                            <div key={req._id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {req.member?.photoUrl ? (
                                                <img src={req.member.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users size={16} className="text-amber-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{req.member?.name}</p>
                                            <p className="text-[10px] text-slate-500">{req.member?.mobile} • {req.member?.memberId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-800">{req.planName}</p>
                                        <p className="text-[10px] text-slate-500">{getDurationLabel(req.planDuration)} • ₹{req.planPrice?.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApproveRenewal(req._id)}
                                        disabled={processing === req._id}
                                        className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                        {processing === req._id ? <RefreshCw size={12} className="animate-spin" /> : <Check size={14} />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRejectRenewal(req._id)}
                                        disabled={processing === req._id}
                                        className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                        <X size={14} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Plan Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={resetForm}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-slate-800">
                                    {editingPlan ? 'Edit Plan' : 'New Plan'}
                                </h3>
                                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100">
                                    <X size={18} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan Name</label>
                                    <input
                                        type="text"
                                        value={formData.planName}
                                        onChange={(e) => setFormData(p => ({ ...p, planName: e.target.value }))}
                                        placeholder="e.g., Monthly Premium"
                                        required
                                        className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</label>
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))}
                                        className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 bg-white"
                                    >
                                        <option value="1">1 Month</option>
                                        <option value="3">3 Months</option>
                                        <option value="6">6 Months</option>
                                        <option value="12">12 Months (1 Year)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                                        placeholder="e.g., 1500"
                                        required
                                        min="0"
                                        className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={16} />}
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Plans List */}
            {plans.length === 0 ? (
                <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                    <FileText size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">No plans created yet</p>
                    <p className="text-slate-400 text-sm mt-1">Create your first membership plan</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Plan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan._id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white rounded-2xl p-5 border ${
                                plan.status === 'Active' ? 'border-slate-200' : 'border-slate-100 opacity-60'
                            } hover:shadow-md transition-all`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">{plan.planName}</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{getDurationLabel(plan.duration)}</p>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                    plan.status === 'Active'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                    {plan.status}
                                </span>
                            </div>

                            <p className="text-2xl font-black text-slate-800 mb-4">
                                ₹{plan.price.toLocaleString('en-IN')}
                                {plan.duration > 1 && (
                                    <span className="text-xs font-medium text-slate-400 ml-1">
                                        (₹{Math.round(plan.price / plan.duration).toLocaleString('en-IN')}/mo)
                                    </span>
                                )}
                            </p>

                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Edit3 size={12} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(plan)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                                        plan.status === 'Active'
                                            ? 'border border-amber-200 text-amber-600 hover:bg-amber-50'
                                            : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                >
                                    {plan.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OwnerPlans;
