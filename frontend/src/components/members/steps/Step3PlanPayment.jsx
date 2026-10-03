import React, { useState, useEffect } from 'react';
import StickyBottomBar from '../../ui/StickyBottomBar';
import { IndianRupee, Tag } from 'lucide-react';
import api from '../../../api/axios';
import { formatDate } from '../../../utils/dateUtils';

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

    const planAmount = Number(data.planAmount ?? data.totalFee) || 0;
    const discountAmount = data.giveDiscount ? Math.min(Number(data.discountAmount) || 0, planAmount) : 0;
    const netTotal = Math.max(planAmount - discountAmount, 0);
    const paidAmount = Number(data.paidFee) || 0;
    const remainingDue = Math.max(netTotal - paidAmount, 0);
    const calculatedExpiryDate = (() => {
        if (!isNew || !data.joiningDate || !data.planDuration) return null;
        const [year, month, day] = data.joiningDate.split('-').map(Number);
        const expiry = new Date(year, month - 1, day);
        expiry.setMonth(expiry.getMonth() + Number(data.planDuration));
        return expiry;
    })();

    const updatePlanAmount = (value) => {
        const amount = Number(value) || 0;
        const appliedDiscount = data.giveDiscount ? Math.min(Number(data.discountAmount) || 0, amount) : 0;
        updateData({ planAmount: value, totalFee: String(Math.max(amount - appliedDiscount, 0)) });
    };

    const isValid = data.joiningDate && data.totalFee !== '' && data.paidFee !== '' && (isNew ? data.planDuration : data.expiryDate);

    const handlePlanSelect = (plan) => {
        if (hasCustomPlans) {
            // Custom plan: fill duration, planName, and suggested totalFee
            updateData({
                planDuration: String(plan.duration),
                planName: plan.planName,
                planAmount: plan.price != null ? String(plan.price) : (data.planAmount ?? data.totalFee),
                totalFee: plan.price != null ? String(Math.max(Number(plan.price) - discountAmount, 0)) : data.totalFee
            });
        } else {
            // Default plan: only fill duration
            updateData({ planDuration: String(plan.duration), planName: null });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mx-auto w-full max-w-3xl p-5 sm:p-7 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800">Plan & Payment</h2>
                    <p className="text-slate-500 text-sm">Set membership, payment and save the member.</p>
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
                            <p className="mt-1 text-xs font-medium text-slate-500">DD/MM/YYYY {data.expiryDate ? `• ${formatDate(data.expiryDate)}` : ''}</p>
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
                        <p className="mt-1 text-xs font-medium text-slate-500">DD/MM/YYYY • {formatDate(data.joiningDate)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Plan Price</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0"
                                value={data.planAmount ?? data.totalFee}
                                onChange={(e) => updatePlanAmount(e.target.value.replace(/\D/g, ''))}
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex cursor-pointer items-center justify-between gap-3">
                        <span className="text-sm font-bold text-slate-700">Give Discount</span>
                        <input
                            type="checkbox"
                            checked={Boolean(data.giveDiscount)}
                            onChange={(e) => {
                                const giveDiscount = e.target.checked;
                                const nextDiscount = giveDiscount ? Math.min(Number(data.discountAmount) || 0, planAmount) : 0;
                                updateData({ giveDiscount, totalFee: String(Math.max(planAmount - nextDiscount, 0)) });
                            }}
                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                    {data.giveDiscount && <div className="mt-3">
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Discount Amount (₹)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><IndianRupee size={16} className="text-slate-400" /></div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0"
                                value={data.discountAmount}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    const discount = Math.min(Number(value) || 0, planAmount);
                                    updateData({ discountAmount: value, totalFee: String(Math.max(planAmount - discount, 0)) });
                                }}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-9 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                            />
                        </div>
                    </div>}
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Payment Summary</p>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-600">Plan Price</dt><dd className="font-bold text-slate-800">₹{planAmount}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-600">Discount</dt><dd className="font-bold text-rose-600">-₹{discountAmount}</dd></div>
                        <div className="flex justify-between border-t border-indigo-100 pt-2"><dt className="font-bold text-slate-700">Net Total</dt><dd className="font-extrabold text-slate-900">₹{netTotal}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-600">Paid</dt><dd className="font-bold text-slate-800">₹{paidAmount}</dd></div>
                        <div className="flex justify-between items-center"><dt className="font-bold text-slate-700">Remaining Due</dt><dd className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${remainingDue === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>₹{remainingDue}</dd></div>
                    </dl>
                    {calculatedExpiryDate && <p className="mt-3 border-t border-indigo-100 pt-3 text-xs font-semibold text-indigo-700">Calculated end date: {formatDate(calculatedExpiryDate)}</p>}
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
