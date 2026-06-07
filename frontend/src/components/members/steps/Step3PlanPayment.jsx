import React, { useState, useEffect } from 'react';
import StickyBottomBar from '../../ui/StickyBottomBar';
import { IndianRupee, Tag } from 'lucide-react';
import api from '../../../api/axios';

const DEFAULT_PLANS = [
    { _id: 'd1', planName: null, duration: 1, price: null, label: '1 Month' },
    { _id: 'd3', planName: null, duration: 3, price: null, label: '3 Months' },
    { _id: 'd6', planName: null, duration: 6, price: null, label: '6 Months' },
    { _id: 'd12', planName: null, duration: 12, price: null, label: '1 Year' }
];

const Step3PlanPayment = ({ data, updateData, onSubmit, isSubmitting }) => {
    const isNew = data.memberType === 'new';
    const [gymPlans, setGymPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);

    useEffect(() => {
        api.get('/api/plans')
            .then(res => setGymPlans(res.data || []))
            .catch(() => setGymPlans([]))
            .finally(() => setPlansLoading(false));
    }, []);

    // Use gym's custom plans if they exist, otherwise fall back to default 1/3/6/12
    const activePlans = gymPlans.filter(p => p.status !== 'Inactive');
    const hasCustomPlans = activePlans.length > 0;

    const isValid = data.joiningDate && data.totalFee !== '' && data.paidFee !== '' && (isNew ? data.planDuration : data.expiryDate);

    const handlePlanSelect = (plan) => {
        if (hasCustomPlans) {
            // Custom plan: fill duration, planName, and suggested totalFee
            updateData({
                planDuration: String(plan.duration),
                planName: plan.planName,
                totalFee: plan.price != null ? String(plan.price) : data.totalFee
            });
        } else {
            // Default plan: only fill duration
            updateData({ planDuration: String(plan.duration), planName: null });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800">Plan & Payment</h2>
                    <p className="text-slate-500 text-sm">Final step to add the member.</p>
                </div>

                <div>
                    <label className="block text-slate-600 text-xs font-bold mb-2 uppercase tracking-wider">Member Type</label>
                    <div className="flex gap-6 mt-1 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="memberType" value="new" checked={isNew} onChange={() => updateData({ memberType: 'new' })} className="w-4 h-4 text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                            <span className={`font-bold ${isNew ? 'text-indigo-600' : 'text-slate-500'}`}>New Member</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="memberType" value="existing" checked={!isNew} onChange={() => updateData({ memberType: 'existing' })} className="w-4 h-4 text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                            <span className={`font-bold ${!isNew ? 'text-indigo-600' : 'text-slate-500'}`}>Existing</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isNew ? (
                        <div>
                            <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">
                                {hasCustomPlans ? 'Select Plan' : 'Plan Duration'}
                            </label>
                            {plansLoading ? (
                                <div className="w-full h-14 bg-slate-100 rounded-xl animate-pulse" />
                            ) : hasCustomPlans ? (
                                <select
                                    value={data.planName || ''}
                                    onChange={(e) => {
                                        const plan = activePlans.find(p => p.planName === e.target.value);
                                        if (plan) handlePlanSelect(plan);
                                    }}
                                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none font-bold"
                                >
                                    <option value="">Choose plan...</option>
                                    {activePlans.map(p => (
                                        <option key={p._id} value={p.planName}>
                                            {p.planName} ({p.duration}M){p.price != null ? ` — ₹${p.price}` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value={data.planDuration}
                                    onChange={(e) => handlePlanSelect(DEFAULT_PLANS.find(p => String(p.duration) === e.target.value))}
                                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none font-bold"
                                >
                                    <option value="1">1 Month</option>
                                    <option value="3">3 Months</option>
                                    <option value="6">6 Months</option>
                                    <option value="12">1 Year</option>
                                </select>
                            )}
                            {data.planName && (
                                <div className="flex items-center gap-1 mt-1.5">
                                    <Tag size={10} className="text-indigo-500" />
                                    <span className="text-xs text-indigo-600 font-medium">{data.planName}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Expiry Date</label>
                            <input
                                type="date"
                                value={data.expiryDate}
                                onChange={(e) => updateData({ expiryDate: e.target.value })}
                                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Joining Date</label>
                        <input
                            type="date"
                            value={data.joiningDate}
                            onChange={(e) => updateData({ joiningDate: e.target.value })}
                            className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Total Fee</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0"
                                value={data.totalFee}
                                onChange={(e) => updateData({ totalFee: e.target.value.replace(/\D/g, '') })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-9 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Paid Amount</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0"
                                value={data.paidFee}
                                onChange={(e) => updateData({ paidFee: e.target.value.replace(/\D/g, '') })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-9 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Payment Method</label>
                    <select
                        value={data.paymentMethod}
                        onChange={(e) => updateData({ paymentMethod: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors appearance-none font-bold"
                    >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online / UPI</option>
                    </select>
                </div>
            </div>

            <StickyBottomBar>
                <button
                    onClick={onSubmit}
                    disabled={!isValid || isSubmitting}
                    className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${isValid && !isSubmitting ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        'Save Member'
                    )}
                </button>
            </StickyBottomBar>
        </div>
    );
};

export default Step3PlanPayment;
